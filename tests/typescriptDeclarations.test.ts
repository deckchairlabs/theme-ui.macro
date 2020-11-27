import path from 'path'
import pluginTester from 'babel-plugin-tester'
import plugin from 'babel-plugin-macros'
import typescriptDeclarations from '../src/plugins/typescriptDeclarations'

pluginTester({
  plugin,
  pluginName: 'theme-ui.macro',
  title: 'TypeScript Declaration',
  snapshot: false,
  babelOptions: {
    presets: ['@babel/preset-typescript'],
    filename: __filename,
  },
  pluginOptions: {
    themeUI: {
      plugins: [
        typescriptDeclarations({
          output: path.join(__dirname, 'generated/theme.d.ts'),
        }),
      ],
    },
  },
  fixtures: path.join(__dirname, 'plugins/typescriptDeclarations'),
})
