import { createMacro, MacroHandler, MacroError } from 'babel-plugin-macros'
import { Theme } from '@theme-ui/css'
import { NodePath } from '@babel/traverse'
import { MacroHandlerParams } from './types'
import { isObjectExpression, ObjectExpression } from '@babel/types'
import resolveBindings from './resolvers/bindings'
import applyDirectiveVisitor from './visitors/applyDirectiveVisitor'

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

  nodePath.traverse({
    ObjectProperty: {
      enter: applyDirectiveVisitor(evaluatedTheme),
    },
  })

  return nodePath.node
}

export default createMacro(macroHandler, {
  configName: 'themeUI',
})
