import { createMacro, MacroHandler, MacroError } from 'babel-plugin-macros'
import * as Babel from '@babel/core'
import { get, scales, Theme } from '@theme-ui/css'
import { NodePath, Node } from '@babel/traverse'
import {
  expressionToCssValue,
  getObjectPropertyKey,
  getObjectPropertyValue,
  notUndefined,
} from './utils'

const internalProperties = ['variant']
const tokenProperties = ['colors', 'space']

function shouldSkipProperty(property: string) {
  return [...tokenProperties, ...internalProperties].includes(property)
}

const macroHandler: MacroHandler = ({ references, state, babel, config }) => {
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

  // Pass the transformed theme through any plugins
  if (config && config.plugins && babel.types.isNode(references.default[0])) {
    const plugins = config.plugins as ((
      expression: Babel.types.ObjectExpression,
      babel: typeof Babel
    ) => void)[]

    if (babel.types.isObjectExpression(references.default[0].parentPath.node)) {
      const objectExpression = references.default[0].parentPath.node
      plugins.forEach((plugin) => plugin(objectExpression, babel))
    }
  }
}

function asFunction(
  argumentsPaths: NodePath<Node> | NodePath<Node>[],
  state: Babel.PluginPass,
  babel: typeof Babel
) {
  if (Array.isArray(argumentsPaths)) {
    const themeArgument = argumentsPaths[0]

    if (babel.types.isObjectExpression(themeArgument.node)) {
      themeArgument.traverse({
        ObjectProperty: {
          enter(path) {
            if (
              babel.types.isStringLiteral(path.node.key) &&
              babel.types.isStringLiteral(path.node.value) &&
              path.node.key.value === '@selector'
            ) {
              // Save the selector to the parent extra property
              path.parentPath.node.extra = {
                ...path.parentPath.node.extra,
                [path.node.key.value]: path.node.value.value,
              }
              // Remove the current objectProperty ie: "@selector"
              path.remove()
            } else if (babel.types.isIdentifier(path.node.value)) {
              const binding = path.scope.getBinding(path.node.value.name)
              if (binding && babel.types.isVariableDeclarator(binding.path)) {
                if (
                  babel.types.isVariableDeclarator(binding.path.node) &&
                  babel.types.isObjectExpression(binding.path.node.init)
                ) {
                  path.replaceWith(
                    babel.types.objectProperty(
                      babel.types.identifier(path.node.value.name),
                      babel.types.objectExpression(
                        binding.path.node.init.properties
                      )
                    )
                  )
                  binding.path.remove()
                }
              }
            }
          },
        },
        SpreadElement: {
          enter(path) {
            if (babel.types.isIdentifier(path.node.argument)) {
              const binding = path.scope.getBinding(path.node.argument.name)
              if (binding && babel.types.isVariableDeclarator(binding.path)) {
                if (
                  babel.types.isVariableDeclarator(binding.path.node) &&
                  babel.types.isObjectExpression(binding.path.node.init)
                ) {
                  path.replaceWithMultiple(binding.path.node.init.properties)
                  binding.path.remove()
                }
              }
            }
          },
        },
      })

      const theme = themeArgument.evaluate().value
      let transformedTheme = transformObjectExpression(
        theme,
        babel,
        themeArgument.node
      )

      transformedTheme = declareCustomProperties(babel, transformedTheme)

      return transformedTheme
    }
  }
}

function declareCustomProperties(
  babel: typeof Babel,
  objectExpression: Babel.types.ObjectExpression
) {
  const tokens = objectExpression.properties.filter((property) => {
    if (babel.types.isObjectProperty(property)) {
      const propertyKey = getObjectPropertyKey(property)
      return propertyKey && tokenProperties.includes(propertyKey)
    }
  })

  const properties = tokens
    .flatMap((token) => {
      if (babel.types.isObjectProperty(token)) {
        const scaleKey = getObjectPropertyKey(token)
        switch (token.value.type) {
          case 'ObjectExpression':
            return token.value.properties.map((property) => {
              if (babel.types.isObjectProperty(property)) {
                const propertyKey = getObjectPropertyKey(property)
                const propertyValue = getObjectPropertyValue(property)
                if (propertyKey && propertyValue) {
                  return babel.types.objectProperty(
                    babel.types.stringLiteral(`--${scaleKey}-${propertyKey}`),
                    babel.types.stringLiteral(propertyValue)
                  )
                }
              }
            })
          case 'ArrayExpression':
            return token.value.elements.map((element, index) => {
              const value = expressionToCssValue(element)
              if (value) {
                return babel.types.objectProperty(
                  babel.types.stringLiteral(`--${scaleKey}-${String(index)}`),
                  babel.types.stringLiteral(value)
                )
              }
            })
        }
      }
    })
    .filter(notUndefined)

  objectExpression.properties.unshift(
    babel.types.objectProperty(
      babel.types.stringLiteral(':root'),
      babel.types.objectExpression(properties)
    )
  )

  return objectExpression
}

function transformObjectExpression(
  theme: Theme,
  babel: typeof Babel,
  objectExpression: Babel.types.ObjectExpression
) {
  objectExpression.properties = objectExpression.properties.map(
    (property, index) => {
      if (babel.types.isObjectProperty(property)) {
        const propertyKey = babel.types.isIdentifier(property.key)
          ? property.key.name
          : babel.types.isStringLiteral(property.key)
          ? property.key.value
          : false

        const scaleKey = propertyKey ? get(scales, propertyKey) || null : null

        if (propertyKey && shouldSkipProperty(propertyKey)) {
          return property
        }

        if (
          propertyKey === '@apply' &&
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

function getPropertyPath(property: string | number, scale?: string) {
  return [scale, property].filter(Boolean).join('.')
}

export default createMacro(macroHandler, {
  configName: 'themeUI',
})
