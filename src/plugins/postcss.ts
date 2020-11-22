import * as fs from 'fs'
import * as Babel from '@babel/core'
import * as PostCSS from 'postcss'
import {
  camelCaseToKebabCase,
  getObjectPropertyKey,
  getObjectPropertyValue,
  notUndefined,
} from '../utils'

export default function postcss(config: any) {
  return (expression: Babel.types.ObjectExpression, babel: typeof Babel) => {
    const stylesheet = PostCSS.root()
    const root = PostCSS.rule({ selector: ':root' })

    stylesheet.append(root)

    const rules = expression.properties
      .map((property) => {
        if (
          babel.types.isObjectProperty(property) &&
          babel.types.isObjectExpression(property.value)
        ) {
          const selector = property.value.extra?.['@selector'] as
            | string
            | undefined

          if (selector) {
            return property.value.properties
              .map((property) => {
                if (
                  babel.types.isObjectProperty(property) &&
                  babel.types.isObjectExpression(property.value)
                ) {
                  const propertyKey = getObjectPropertyKey(property)
                  const nodes = objectExpressionToDeclarations(property.value)

                  return PostCSS.rule({
                    selector: `${selector}-${propertyKey}`,
                    nodes,
                  })
                }
              })
              .filter(notUndefined)
          }
        }
      })
      .filter(notUndefined)
      .flat()

    stylesheet.append(rules)

    const result = stylesheet.toResult({ to: 'test.css' })

    if (result.opts.to) {
      fs.writeFileSync(result.opts.to, result.css)
    }
  }
}

function objectExpressionToDeclarations(
  objectExpression: Babel.types.ObjectExpression
) {
  return objectExpression.properties
    .map((property) => {
      if (Babel.types.isObjectProperty(property)) {
        const propertyKey = getObjectPropertyKey(property)
        const propertyValue = getObjectPropertyValue(property)

        if (propertyKey && propertyValue) {
          const prop = camelCaseToKebabCase(propertyKey)
          return PostCSS.decl({
            prop,
            value: propertyValue,
          })
        }
      }
    })
    .filter(notUndefined)
}
