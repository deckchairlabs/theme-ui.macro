import { createMacro, MacroHandler, MacroError } from 'babel-plugin-macros'
import * as Babel from '@babel/core'
import { get, Theme } from '@theme-ui/css'
import { NodePath } from '@babel/traverse'
import { MacroHandlerParams } from './types'
import { notUndefined } from './utils'
import {
  arrayExpression,
  Expression,
  isIdentifier,
  isObjectExpression,
  isObjectProperty,
  isStringLiteral,
  numericLiteral,
  objectExpression,
  ObjectExpression,
  objectProperty,
  spreadElement,
  stringLiteral,
} from '@babel/types'
import resolveBindings from './resolvers/bindings'

const internalProperties = ['variant']

function shouldSkipProperty(property: string) {
  return [...internalProperties].includes(property)
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
        // Replace the path to the macro call expression with the transformedTheme object expression
        referencePath.parentPath.replaceWith(transformedTheme)
        const evaluatedTheme = referencePath.parentPath.evaluate()

        // Pass the transformed theme through any provided plugins
        if (evaluatedTheme.confident && config?.plugins) {
          const theme = evaluatedTheme.value as Theme

          config.plugins.forEach((plugin) => {
            plugin(referencePath.parentPath, theme, babel)
          })
        } else if (!evaluatedTheme.confident) {
          throw new MacroError(
            'Could not confidently evaluate the transformed theme.'
          )
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
      }
      return property
    }
  )

  return objectExpression
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
