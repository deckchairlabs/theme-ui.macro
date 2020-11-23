import { createMacro, MacroHandler, MacroError } from 'babel-plugin-macros'
import * as Babel from '@babel/core'
import { get, scales, Theme } from '@theme-ui/css'
import { NodePath, Node } from '@babel/traverse'
import { ObjectPropertyVisitor } from './visitors/ObjectProperty'
import { SpreadElementVisitor } from './visitors/SpreadElement'
import { MacroHandlerParams } from './types'
import {
  expressionToCssValue,
  getObjectPropertyKey,
  getObjectPropertyValue,
  getPropertyPath,
  notUndefined,
  toCustomPropertyValue,
} from './utils'
import {
  ArrayExpression,
  arrayExpression,
  Expression,
  isIdentifier,
  isNumericLiteral,
  isObjectExpression,
  isObjectProperty,
  isSpreadElement,
  isStringLiteral,
  isVariableDeclarator,
  numericLiteral,
  objectExpression,
  ObjectExpression,
  objectProperty,
  spreadElement,
  stringLiteral,
} from '@babel/types'
import resolveBindings from './resolvers/bindings'

const internalProperties = ['variant']
const tokenProperties = ['colors', 'space']

function shouldSkipProperty(property: string) {
  return [...tokenProperties, ...internalProperties].includes(property)
}

const macroHandler: MacroHandler = ({
  references,
  babel,
  config,
}: MacroHandlerParams) => {
  const { default: defaultImport = [] } = references

  defaultImport.forEach((referencePath) => {
    if (babel.types.isCallExpression(referencePath.parentPath)) {
      const callArguments = referencePath.parentPath.get(
        'arguments'
      ) as NodePath<ObjectExpression>[]

      if (!isObjectExpression(callArguments[0])) {
        throw new MacroError(
          'theme-ui.macro must be called with a theme object.'
        )
      }

      const transformedTheme = asFunction(callArguments[0])

      if (transformedTheme) {
        // Replace the path to the macro call expression with the final object expression
        referencePath.parentPath.replaceWith(transformedTheme)

        // Pass the transformed theme through any provided plugins
        if (config?.plugins) {
          config.plugins.forEach((plugin) => plugin(transformedTheme, babel))
        }
      }
    } else {
      throw new MacroError(
        'theme-ui.macro only supports being called as a function.'
      )
    }
  })
}

function asFunction(nodePath: NodePath<ObjectExpression>) {
  resolveBindings(nodePath)

  const evaluatedTheme = nodePath.evaluate().value
  const transformedTheme = transformObjectExpression(
    evaluatedTheme,
    nodePath.node
  )

  return transformedTheme
}

function isObjectPropertyFilter(
  expression:
    | Babel.types.ObjectMethod
    | Babel.types.ObjectProperty
    | Babel.types.SpreadElement
    | undefined
): expression is Babel.types.ObjectProperty {
  return Babel.types.isObjectProperty(expression)
}

// function declareCustomProperties(
//   babel: typeof Babel,
//   objectExpression: Babel.types.ObjectExpression
// ) {
//   const tokens = objectExpression.properties
//     .filter((property) => {
//       if (babel.types.isObjectProperty(property)) {
//         const propertyKey = getObjectPropertyKey(property)
//         return propertyKey && tokenProperties.includes(propertyKey)
//       }

//       return false
//     })
//     .filter(isObjectPropertyFilter)

//   const properties = tokens
//     .flatMap((token) => {
//       const scaleKey = getObjectPropertyKey(token)
//       switch (token.value.type) {
//         case 'ObjectExpression':
//           return token.value.properties.map((property) => {
//             if (babel.types.isObjectProperty(property)) {
//               const propertyKey = getObjectPropertyKey(property)
//               const propertyValue = getObjectPropertyValue(property)
//               if (propertyKey && propertyValue) {
//                 return babel.types.objectProperty(
//                   babel.types.stringLiteral(`--${scaleKey}-${propertyKey}`),
//                   babel.types.stringLiteral(propertyValue)
//                 )
//               }
//             }
//           })
//         case 'ArrayExpression':
//           return token.value.elements.map((element, index) => {
//             const value = expressionToCssValue(element)
//             if (value) {
//               return babel.types.objectProperty(
//                 babel.types.stringLiteral(`--${scaleKey}-${String(index)}`),
//                 babel.types.stringLiteral(value)
//               )
//             }
//           })
//       }
//     })
//     .filter(notUndefined)

//   objectExpression.properties.unshift(
//     babel.types.objectProperty(
//       babel.types.stringLiteral(':root'),
//       babel.types.objectExpression(properties)
//     )
//   )

//   return objectExpression
// }

function transformObjectExpression(
  theme: Theme,
  objectExpression: ObjectExpression
) {
  objectExpression.properties = objectExpression.properties.map(
    (property, index) => {
      if (isObjectProperty(property)) {
        const propertyKey = isIdentifier(property.key)
          ? property.key.name
          : isStringLiteral(property.key)
          ? property.key.value
          : false

        const scaleKey = propertyKey ? get(scales, propertyKey) || null : null

        if (propertyKey && shouldSkipProperty(propertyKey)) {
          return property
        }

        if (propertyKey === '@apply' && isStringLiteral(property.value)) {
          const applyObjectExpression: Record<
            string,
            string | number | string[] | number[]
          > = get(theme, property.value.value)

          return transformSpreadObject(theme, applyObjectExpression)
        }

        switch (property.value.type) {
          case 'StringLiteral':
          case 'NumericLiteral':
            const propertyValue = String(property.value.value)
            const isThemeToken =
              get(theme, getPropertyPath(propertyValue, scaleKey)) !== undefined

            if (isThemeToken) {
              property.value = stringLiteral(
                toCustomPropertyValue(propertyValue, scaleKey)
              )
            }
            break
          case 'ArrayExpression':
            property.value = arrayExpression(
              transformArrayExpression(property.value, scaleKey)
            )
            break
          case 'ObjectExpression':
            property.value = transformObjectExpression(theme, property.value)
            break
        }
      }
      return property
    }
  )

  return objectExpression
}

function transformArrayExpression(
  arrayExpression: ArrayExpression,
  scaleKey?: string
) {
  return arrayExpression.elements.map((element) => {
    if (isStringLiteral(element) || isNumericLiteral(element)) {
      return stringLiteral(
        toCustomPropertyValue(String(element.value), scaleKey)
      )
    }

    return element
  })
}

function transformSpreadObject(
  theme: Theme,
  object: Record<string, string | number | string[] | number[]>
) {
  function primitiveToBabelExpression(
    primitive: string | number | any[]
  ): Expression {
    if (Array.isArray(primitive)) {
      return arrayExpression(primitive.map(primitiveToBabelExpression))
    }
    return typeof primitive === 'string'
      ? stringLiteral(primitive)
      : numericLiteral(primitive)
  }

  const properties = Object.entries(object)
    .map(([identifier, value]) => {
      const valueExpression = primitiveToBabelExpression(value)

      if (valueExpression) {
        return objectProperty(stringLiteral(identifier), valueExpression)
      }
    })
    .filter(notUndefined)

  return spreadElement(
    transformObjectExpression(theme, objectExpression(properties))
  )
}

export default createMacro(macroHandler, {
  configName: 'themeUI',
})
