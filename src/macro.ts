import { createMacro, MacroHandler, MacroError } from 'babel-plugin-macros'
import * as Babel from '@babel/core'
import { get, scales, Theme } from '@theme-ui/css'
import { NodePath, Node } from '@babel/traverse'

const internalProperties = ['variant']
const rootProperties = ['colors', 'space']

function shouldSkipProperty(property: string) {
  return [...rootProperties, ...internalProperties].includes(property)
}

const macroHandler: MacroHandler = ({ references, state, babel }) => {
  references.default.forEach((referencePath) => {
    if (babel.types.isCallExpression(referencePath.parentPath)) {
      const objectExpression = asFunction(
        referencePath.parentPath.get('arguments'),
        state,
        babel
      )
      if (objectExpression) {
        referencePath.parentPath.replaceWith(objectExpression)
      }
    } else {
      throw new MacroError()
    }
  })
}

function asFunction(
  argumentsPaths: NodePath<Node> | NodePath<Node>[],
  { file: { opts: fileOptions } }: Babel.PluginPass,
  babel: typeof Babel
) {
  if (Array.isArray(argumentsPaths)) {
    const themeArgument = argumentsPaths[0]
    const theme: Theme = themeArgument.evaluate().value
    const stringified = JSON.stringify(theme)

    const declarationNode = babel.template(`var x = ${stringified}`, {
      preserveComments: true,
      placeholderPattern: false,
      ...fileOptions.parserOpts,
      sourceType: 'unambiguous',
    })()

    if (
      !Array.isArray(declarationNode) &&
      babel.types.isVariableDeclaration(declarationNode)
    ) {
      const objectDeclaration = declarationNode.declarations[0]
      const objectExpression = objectDeclaration.init

      if (babel.types.isObjectExpression(objectExpression)) {
        const transformedTheme = transformObjectExpression(
          theme,
          babel,
          objectExpression
        )

        return transformedTheme
      }
    }
  }
}

function transformObjectExpression(
  theme: Theme,
  babel: typeof Babel,
  objectExpression: Babel.types.ObjectExpression
) {
  objectExpression.properties = objectExpression.properties.map(
    (property, index) => {
      if (babel.types.isObjectProperty(property)) {
        const propertyKey =
          babel.types.isStringLiteral(property.key) && property.key.value

        const scaleKey = propertyKey ? get(scales, propertyKey) || null : null

        if (propertyKey && shouldSkipProperty(propertyKey)) {
          return property
        }

        if (
          propertyKey === '@apply' &&
          babel.types.isStringLiteral(property.key) &&
          babel.types.isStringLiteral(property.value)
        ) {
          const applyObjectExpression: Record<
            string,
            string | number | string[] | number[]
          > = get(theme, property.value.value)

          return transformSpreadObject(theme, babel, applyObjectExpression)
        }

        switch (property.value.type) {
          case 'StringLiteral':
          case 'NumericLiteral':
            const propertyValue = String(property.value.value)
            const isThemeToken =
              get(theme, getPropertyPath(propertyValue, scaleKey)) !== undefined

            if (isThemeToken) {
              property.value = babel.types.stringLiteral(
                toVarValue(propertyValue, scaleKey)
              )
            }
            break
          case 'ArrayExpression':
            property.value = babel.types.arrayExpression(
              transformArrayExpression(babel, property.value, scaleKey)
            )
            break
          case 'ObjectExpression':
            property.value = transformObjectExpression(
              theme,
              babel,
              property.value
            )
            break
        }
      }
      return property
    }
  )

  return objectExpression
}

function transformArrayExpression(
  babel: typeof Babel,
  arrayExpression: Babel.types.ArrayExpression,
  scaleKey?: string
) {
  return arrayExpression.elements.map((element) => {
    if (
      babel.types.isStringLiteral(element) ||
      babel.types.isNumericLiteral(element)
    ) {
      return babel.types.stringLiteral(
        toVarValue(String(element.value), scaleKey)
      )
    }

    return element
  })
}

function transformSpreadObject(
  theme: Theme,
  babel: typeof Babel,
  object: Record<string, string | number | string[] | number[]>
) {
  function primitiveToBabelExpression(
    primitive: string | number | any[]
  ): Babel.types.Expression {
    if (Array.isArray(primitive)) {
      return babel.types.arrayExpression(
        primitive.map(primitiveToBabelExpression)
      )
    }
    return typeof primitive === 'string'
      ? babel.types.stringLiteral(primitive)
      : babel.types.numericLiteral(primitive)
  }

  const properties = Object.entries(object)
    .map(([identifier, value]) => {
      const valueExpression = primitiveToBabelExpression(value)

      if (valueExpression) {
        return babel.types.objectProperty(
          babel.types.stringLiteral(identifier),
          valueExpression
        )
      }
    })
    .filter(notUndefined)

  return babel.types.spreadElement(
    transformObjectExpression(
      theme,
      babel,
      babel.types.objectExpression(properties)
    )
  )
}

function toVarValue(property: string | number, scale?: string) {
  const path = getPropertyPath(property, scale)
  return `var(--${path.replace(/\./g, '-')})`
}

function notUndefined<TValue>(
  value: TValue | null | undefined
): value is TValue {
  return value !== undefined
}

function getPropertyPath(property: string | number, scale?: string) {
  return [scale, property].filter(Boolean).join('.')
}

export default createMacro(macroHandler, {
  configName: 'themeUI',
})
