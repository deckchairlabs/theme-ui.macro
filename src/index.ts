import { createMacro, MacroHandler, MacroError } from 'babel-plugin-macros'
import * as Babel from '@babel/core'
import { NodePath } from '@babel/traverse'
import { isObjectExpression, ObjectExpression } from '@babel/types'
import { Theme } from '@theme-ui/css'
import { MacroHandlerParams, Plugin } from './types'
import resolveBindings from './resolvers/bindings'
import applyDirectiveVisitor from './visitors/applyDirectiveVisitor'

import customProperties from './plugins/customProperties'
import generateStylesheet from './plugins/generateStylesheet'
import generateTypescriptDeclaration from './plugins/generateTypescriptDeclaration'

const macroHandler: MacroHandler = ({
  references,
  babel,
  state,
  config,
}: MacroHandlerParams) => {
  const { default: defaultImport = [] } = references
  const plugins: Plugin[] = resolvePlugins(config)

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

      const transformedTheme = asFunction(callArguments[0], babel, state)

      if (transformedTheme) {
        // Replace the path to the macro call expression with the transformedTheme object expression
        referencePath.parentPath.replaceWith(transformedTheme)
        const evaluatedTheme = referencePath.parentPath.evaluate()

        // Pass the transformed theme through any provided plugins
        if (evaluatedTheme.confident) {
          const theme = evaluatedTheme.value as Theme

          plugins.forEach((plugin) => {
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

function asFunction(
  nodePath: NodePath<ObjectExpression>,
  babel: typeof Babel,
  state: Babel.PluginPass
) {
  resolveBindings(babel, state)
  const evaluatedTheme = nodePath.evaluate().value

  nodePath.traverse({
    ObjectProperty: {
      enter: applyDirectiveVisitor(evaluatedTheme),
    },
  })

  return nodePath.node
}

function resolvePlugins(config: MacroHandlerParams['config']) {
  const plugins: Plugin[] = []

  if (config?.customProperties) {
    plugins.push(customProperties(config.customProperties))
  }

  if (config?.generateStylesheet) {
    plugins.push(generateStylesheet(config.generateStylesheet))
  }

  if (config?.generateTSDeclaration) {
    plugins.push(generateTypescriptDeclaration(config.generateTSDeclaration))
  }

  return plugins
}

const themeUIMacro: (theme: object) => Theme = createMacro(macroHandler, {
  configName: 'themeUI',
})

export default themeUIMacro
