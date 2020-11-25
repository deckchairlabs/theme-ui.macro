import path from 'path'
import pluginTester from 'babel-plugin-tester'
import plugin from 'babel-plugin-macros'
import typescriptDeclarations from '../src/plugins/typescriptDeclarations'

pluginTester({
  plugin,
  pluginName: 'theme-ui.macro',
  snapshot: false,
  babelOptions: {
    presets: ['@babel/preset-typescript'],
    filename: __filename,
  },
  pluginOptions: {
    themeUI: {
      plugins: [typescriptDeclarations()],
    },
  },
  fixtures: path.join(__dirname, 'plugins/typescriptDeclarations'),
})
