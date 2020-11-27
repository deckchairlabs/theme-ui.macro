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
import { Plugin, GenerateStylesheetPluginConfig } from '../types'
import { isStringLiteral } from '@babel/types'

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

    const customProperties = resolveCustomPropertyDeclarations(path)

    if (customProperties.size > 0) {
      const root = PostCSS.rule({
        selector: ':root',
        nodes: Array.from(customProperties.values()),
      })

      stylesheet.append(root)
    }

    const nodes = resolveSelectorNodes(selectors, theme)

    stylesheet.append(nodes)

    const result = stylesheet.toResult({ to: output })
    const processor = PostCSS.default([nested()])
    const processed = processor.process(result)

    if (result.opts.to) {
      fs.writeFileSync(result.opts.to, processed.css)
    }
  }
}

function resolveCustomPropertyDeclarations(path: Babel.NodePath<Babel.Node>) {
  const customProperties: Map<string, PostCSS.Declaration> = new Map()

  function addCustomProperty(prop: string, value: string) {
    customProperties.set(
      prop,
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
          isStringLiteral(nodePath.node.value) &&
          isStringLiteral(nodePath.node.key) &&
          nodePath.node.key.value.startsWith('--')
        ) {
          addCustomProperty(nodePath.node.key.value, nodePath.node.value.value)
        }
      },
    },
  })

  return customProperties
}

function resolveSelectorNodes(selectors: Record<string, string>, theme: Theme) {
  return Object.entries(selectors)
    .map(([key, selector]) => {
      const object = theme[key as keyof Theme]
      if (typeof object === 'object') {
        return objectToPostCSSNode(theme, object, selector)
      }
    })
    .filter(notUndefined)
}

function objectToPostCSSNode(theme: Theme, object: object, selector: string) {
  const nodes: PostCSS.Node[] = Object.entries(object)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        const styles = css({ [key]: value })(theme)
        return cssObjectToPostCSSDeclarations(styles)
      } else {
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
  const declarations: PostCSS.Node[] = Object.entries(css)
    .map(([key, value]) => {
      if (key.startsWith('@media')) {
        return PostCSS.atRule({
          name: 'media',
          params: key.replace('@media', '').trim(),
          nodes: cssObjectToPostCSSDeclarations(value as CSSObject),
        })
      } else {
        const prop = camelCaseToKebabCase(key)
        const cssValue = primitiveToCssValue(value as string | number)
        return PostCSS.decl({
          prop,
          value: cssValue,
        })
      }
    })
    .filter(notUndefined)

  return declarations
}
