import * as fs from 'fs'
import * as Babel from '@babel/core'
import * as PostCSS from 'postcss'
import nested from 'postcss-nested'
import {
  camelCaseToKebabCase,
  getObjectPropertyKey,
  getObjectPropertyValue,
  notUndefined,
} from '../utils'

type PostCSSPluginConfig = {
  output: string
  selectors: Record<string, string>
  selectorSeparator?: string
}

export default function postcss(config: PostCSSPluginConfig) {
  return (expression: Babel.types.ObjectExpression, babel: typeof Babel) => {
    const stylesheet = PostCSS.root()
    const selectors = { ':root': ':root', ...config.selectors }

    const rules = Object.entries(selectors)
      .flatMap(([key, selector]) => {
        const property = expression.properties.find((property) => {
          return (
            babel.types.isObjectProperty(property) &&
            babel.types.isObjectExpression(property.value) &&
            (babel.types.isIdentifier(property.key) ||
              babel.types.isStringLiteral(property.key)) &&
            getObjectPropertyKey(property) === key
          )
        })

        if (babel.types.isObjectProperty(property)) {
          return objectExpressionToRules(property, [selector])
        }
      })
      .filter(notUndefined)

    stylesheet.append(rules)

    const result = stylesheet.toResult({ to: config.output })
    const processor = PostCSS.default([nested()])
    const processed = processor.process(result)

    if (result.opts.to) {
      fs.writeFileSync(result.opts.to, processed.css)
    }
  }
}

function objectExpressionToRules(
  expression: Babel.types.ObjectProperty | Babel.types.ObjectExpression,
  selector: string[]
): PostCSS.Node[] | PostCSS.Node | undefined {
  switch (expression.type) {
    case 'ObjectExpression':
      const nodes = expression.properties
        .flatMap((property): PostCSS.Node[] | PostCSS.Node | undefined => {
          if (Babel.types.isObjectExpression(property)) {
            return objectExpressionToRules(property, selector)
          } else if (Babel.types.isObjectProperty(property)) {
            const propertyKey = getObjectPropertyKey(property)
            if (propertyKey && Babel.types.isObjectExpression(property.value)) {
              return objectExpressionToRules(property.value, [
                `&-${propertyKey}`,
              ])
            } else {
              const propertyKey = getObjectPropertyKey(property)
              const propertyValue = getObjectPropertyValue(property)

              if (propertyKey && propertyValue) {
                const prop = camelCaseToKebabCase(propertyKey)
                return [
                  PostCSS.decl({
                    prop,
                    value: propertyValue,
                  }),
                ]
              }
            }
          }
        })
        .filter(notUndefined)

      return PostCSS.rule({
        selector: selector.join('-'),
        nodes,
      })
    case 'ObjectProperty':
      if (Babel.types.isObjectExpression(expression.value)) {
        return objectExpressionToRules(expression.value, selector)
      }
      break
  }
}
