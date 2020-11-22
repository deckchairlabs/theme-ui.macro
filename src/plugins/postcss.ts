import * as fs from 'fs'
import * as Babel from '@babel/core'
import * as PostCSS from 'postcss'
import { notUndefined } from '../utils'

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
          const selectorProperty = property.value.properties.find(
            (property) => {
              return (
                babel.types.isObjectProperty(property) &&
                babel.types.isStringLiteral(property.key) &&
                babel.types.isStringLiteral(property.value) &&
                property.key.value === '@selector'
              )
            }
          )

          if (
            babel.types.isObjectProperty(selectorProperty) &&
            babel.types.isStringLiteral(selectorProperty.value)
          ) {
            const selector = selectorProperty.value.value
            return PostCSS.rule({ selector })
          }
        }
      })
      .filter(notUndefined)

    stylesheet.append(rules)

    const result = stylesheet.toResult({ to: 'test.css' })

    if (result.opts.to) {
      fs.writeFileSync(result.opts.to, result.css)
    }
  }
}
