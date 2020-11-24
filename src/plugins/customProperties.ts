import * as Babel from '@babel/core'
import { Theme, get, scales } from '@theme-ui/css'
import { Plugin } from '../types'
import { primitiveToCssValue } from '../utils'

type CustomPropertiesPluginConfig = {}

function onlyUnique(value: any, index: number, self: any[]) {
  return self.indexOf(value) === index
}

export default function CustomPropertiesPlugin(
  config?: CustomPropertiesPluginConfig
): Plugin {
  return (
    path: Babel.NodePath<Babel.Node>,
    theme: Theme,
    babel: typeof Babel
  ) => {
    const customProperties: babel.types.ObjectProperty[] = []
    const tokens = Object.values(scales).filter(onlyUnique)

    path.traverse({
      ObjectProperty: {
        enter(nodePath) {
          if (
            babel.types.isIdentifier(nodePath.node.key) &&
            //@ts-ignore
            tokens.includes(nodePath.node.key.name)
          ) {
            nodePath.traverse({
              ObjectProperty: {
                enter(nodePath) {
                  if (
                    babel.types.isIdentifier(nodePath.node.key) &&
                    babel.types.isStringLiteral(nodePath.node.value)
                  ) {
                    const propertyPath = [
                      ...getPropertyPath(nodePath),
                      nodePath.node.key.name,
                    ]

                    const propertyIdentifier = `--${propertyPath.join('-')}`
                    const propertyValue = `var(${propertyIdentifier})`

                    customProperties.push(
                      babel.types.objectProperty(
                        babel.types.stringLiteral(propertyIdentifier),
                        babel.types.stringLiteral(nodePath.node.value.value)
                      )
                    )

                    nodePath.node.value = babel.types.stringLiteral(
                      propertyValue
                    )
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

                      const propertyIdentifier = `--${propertyPath.join('-')}`
                      const themeValue = get(theme, propertyPath.join('.'))
                      const propertyValue = primitiveToCssValue(themeValue)

                      customProperties.push(
                        babel.types.objectProperty(
                          babel.types.stringLiteral(propertyIdentifier),
                          babel.types.stringLiteral(propertyValue)
                        )
                      )

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

    const reevaluatedTheme = path.evaluate().value

    path.traverse({
      ObjectProperty: {
        enter(nodePath) {
          if (babel.types.isIdentifier(nodePath.node.key)) {
            const propertyKey = nodePath.node.key.name
            const scaleName = scales[propertyKey as keyof typeof scales]
            if (
              scaleName &&
              (babel.types.isStringLiteral(nodePath.node.value) ||
                babel.types.isNumericLiteral(nodePath.node.value))
            ) {
              const themeKey = [scaleName, nodePath.node.value.value].join('.')
              nodePath.node.value = babel.types.stringLiteral(
                get(reevaluatedTheme, themeKey)
              )
            }
          }
        },
      },
    })

    if (babel.types.isObjectExpression(path.node)) {
      path.node.properties.unshift(
        babel.types.objectProperty(
          babel.types.stringLiteral(':custom-properties'),
          babel.types.objectExpression(customProperties)
        )
      )
    }
  }
}

function getPropertyPath(
  nodePath:
    | Babel.NodePath<Babel.types.ObjectProperty>
    | Babel.NodePath<Babel.types.ArrayExpression>
) {
  const propertyPath: string[] = []

  let parentPath = nodePath.parentPath
  while (
    Babel.types.isObjectExpression(parentPath.node) ||
    Babel.types.isObjectProperty(parentPath.node)
  ) {
    if (Babel.types.isObjectProperty(parentPath.node)) {
      if (Babel.types.isIdentifier(parentPath.node.key)) {
        propertyPath.push(parentPath.node.key.name)
      }
    }
    parentPath = parentPath.parentPath
  }

  return propertyPath.reverse()
}
