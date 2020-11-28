import * as Babel from '@babel/core'
import {
  identifier,
  isIdentifier,
  isObjectExpression,
  isObjectProperty,
  isStringLiteral,
  objectExpression,
  ObjectMember,
  objectProperty,
  SpreadElement,
  stringLiteral,
} from '@babel/types'
import { Theme, get, scales } from '@theme-ui/css'
import { Plugin, CustomPropertiesPluginConfig } from '../types'
import { primitiveToCssValue } from '../utils'

function onlyUnique(value: any, index: number, self: any[]) {
  return self.indexOf(value) === index
}

function getCustomPropertyIdentifier(path: string[], prefix?: string) {
  return `--${[prefix, ...path].filter(Boolean).join('-')}`
}

export default function CustomPropertiesPlugin(
  config?: CustomPropertiesPluginConfig
): Plugin {
  const { prefix = 'theme-ui' } = config || {}

  return (
    path: Babel.NodePath<Babel.Node>,
    theme: Theme,
    babel: typeof Babel
  ) => {
    const customProperties: Babel.types.ObjectProperty[] = []
    const tokens = Object.values(scales).filter(onlyUnique)

    function addCustomProperty(key: string, value: string) {
      customProperties.push(
        objectProperty(stringLiteral(key), stringLiteral(value))
      )
    }

    path.traverse({
      ObjectProperty: {
        enter(nodePath) {
          if (
            isIdentifier(nodePath.node.key) &&
            //@ts-ignore
            tokens.includes(nodePath.node.key.name)
          ) {
            nodePath.traverse({
              ObjectProperty: {
                enter(nodePath) {
                  if (
                    isIdentifier(nodePath.node.key) &&
                    isStringLiteral(nodePath.node.value)
                  ) {
                    const propertyPath = [
                      ...getPropertyPath(nodePath),
                      nodePath.node.key.name,
                    ]

                    const propertyIdentifier = getCustomPropertyIdentifier(
                      propertyPath,
                      prefix
                    )
                    const propertyValue = `var(${propertyIdentifier})`

                    addCustomProperty(
                      propertyIdentifier,
                      nodePath.node.value.value
                    )

                    nodePath.node.value = stringLiteral(propertyValue)
                  }
                },
              },
              ArrayExpression: {
                enter(nodePath) {
                  nodePath.node.elements = nodePath.node.elements.map(
                    (element, index) => {
                      const propertyPath = [
                        ...getPropertyPath(nodePath),
                        String(index),
                      ]

                      const propertyIdentifier = getCustomPropertyIdentifier(
                        propertyPath,
                        prefix
                      )
                      const themeValue = get(theme, propertyPath.join('.'))
                      const propertyValue = primitiveToCssValue(themeValue)

                      addCustomProperty(propertyIdentifier, propertyValue)

                      return babel.types.stringLiteral(
                        `var(${propertyIdentifier})`
                      )
                    }
                  )
                },
              },
            })
          }
        },
      },
    })

    if (isObjectExpression(path.node)) {
      const existingStylesProperty = findObjectPropertyByName(
        'styles',
        path.node.properties
      )
      if (
        isObjectProperty(existingStylesProperty) &&
        isObjectExpression(existingStylesProperty.value)
      ) {
        const existingRootProperty = findObjectPropertyByName(
          'root',
          existingStylesProperty.value.properties
        )

        if (
          isObjectProperty(existingRootProperty) &&
          isObjectExpression(existingRootProperty.value)
        ) {
          existingRootProperty.value.properties.unshift(...customProperties)
        } else {
          existingStylesProperty.value.properties.unshift(
            createObjectExpressionObjectProperty(
              'root',
              objectExpression(customProperties)
            )
          )
        }
      } else {
        path.node.properties.unshift(
          createStylesRootObjectProperty(customProperties)
        )
      }
    }
  }
}

function createStylesRootObjectProperty(
  customProperties: Babel.types.ObjectProperty[]
) {
  return createObjectExpressionObjectProperty(
    'styles',
    objectExpression([
      createObjectExpressionObjectProperty(
        'root',
        objectExpression(customProperties)
      ),
    ])
  )
}

function createObjectExpressionObjectProperty(
  name: string,
  expression: Babel.types.ObjectExpression
) {
  return objectProperty(identifier(name), expression)
}

function findObjectPropertyByName(
  name: string,
  properties: (ObjectMember | SpreadElement)[]
) {
  return properties.find(
    (property) =>
      isObjectProperty(property) &&
      isIdentifier(property.key) &&
      property.key.name === name
  )
}

function getPropertyPath(
  nodePath:
    | Babel.NodePath<Babel.types.ObjectProperty>
    | Babel.NodePath<Babel.types.ArrayExpression>
) {
  const propertyPath: string[] = []

  let parentPath = nodePath.parentPath
  while (
    isObjectExpression(parentPath.node) ||
    isObjectProperty(parentPath.node)
  ) {
    if (isObjectProperty(parentPath.node)) {
      if (isIdentifier(parentPath.node.key)) {
        propertyPath.push(parentPath.node.key.name)
      }
    }
    parentPath = parentPath.parentPath
  }

  return propertyPath.reverse()
}
