import * as fs from 'fs'
import * as Babel from '@babel/core'
import { MacroError } from 'babel-plugin-macros'
import { Theme, css, CSSObject } from '@theme-ui/css'
import * as PostCSS from 'postcss'
import nested from 'postcss-nested'
import {
  camelCaseToKebabCase,
  notUndefined,
  primitiveToCssValue,
} from '../utils'
import { Plugin } from '../types'

type GenerateStylesheetPluginConfig = {
  output: string
  selectors: Record<string, string>
  selectorSeparator?: string
}

export default function GenerateStylesheetPlugin(
  config: GenerateStylesheetPluginConfig
): Plugin {
  const { output, selectors } = config
  return (
    path: Babel.NodePath<Babel.Node>,
    theme: Theme,
    babel: typeof Babel
  ) => {
    const stylesheet = PostCSS.root()

    if (!babel.types.isObjectExpression(path.node)) {
      throw new MacroError('Expected an object expression')
    }

    // Find any objectProperty that looks like a custom property declaration
    const customProperties: PostCSS.Declaration[] = []

    function addCustomProperty(prop: string, value: string) {
      customProperties.push(
        PostCSS.decl({
          prop,
          value,
        })
      )
    }

    path.traverse({
      ObjectProperty: {
        enter(nodePath) {
          if (
            babel.types.isStringLiteral(nodePath.node.value) &&
            babel.types.isStringLiteral(nodePath.node.key) &&
            nodePath.node.key.value.startsWith('--')
          ) {
            addCustomProperty(
              nodePath.node.key.value,
              nodePath.node.value.value
            )
          }
        },
      },
    })

    if (customProperties.length > 0) {
      const root = PostCSS.rule({
        selector: ':root',
        nodes: customProperties,
      })

      stylesheet.append(root)
    }

    const nodes = Object.entries(selectors)
      .map(([key, selector]) => {
        const object = theme[key as keyof Theme]
        if (typeof object === 'object') {
          return objectToPostCSSNode(theme, object, selector)
        }
      })
      .filter(notUndefined)

    stylesheet.append(nodes)

    const result = stylesheet.toResult({ to: output })
    const processor = PostCSS.default([nested()])
    const processed = processor.process(result)

    if (result.opts.to) {
      fs.writeFileSync(result.opts.to, processed.css)
    }
  }
}

function objectToPostCSSNode(theme: Theme, object: object, selector: string) {
  const nodes: PostCSS.Node[] = Object.entries(object)
    .map(([key, value]) => {
      switch (typeof value) {
        case 'string':
        case 'number':
          const styles = css({ [key]: value })(theme)
          return cssObjectToPostCSSDeclarations(styles)
        case 'object':
          const isPseudo = key.startsWith(':')
          const separator = isPseudo ? '' : '-'
          return objectToPostCSSNode(theme, value, `&${separator}${key}`)
      }
    })
    .filter(notUndefined)
    .flat()

  return PostCSS.rule({
    selector,
    nodes,
  })
}

function cssObjectToPostCSSDeclarations(css: CSSObject) {
  const declarations: PostCSS.Declaration[] = Object.entries(css).map(
    ([key, value]) => {
      const prop = camelCaseToKebabCase(key)
      const cssValue = primitiveToCssValue(value as string | number)
      return PostCSS.decl({
        prop,
        value: cssValue,
      })
    }
  )

  return declarations
}
