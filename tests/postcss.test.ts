import path from 'path'
import pluginTester from 'babel-plugin-tester'
import plugin from 'babel-plugin-macros'
import postcss from '../src/plugins/postcss'

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
      plugins: [
        postcss({ output: path.resolve(__dirname, './theme.generated.css') }),
      ],
    },
  },
  fixtures: path.join(__dirname, 'plugins/postcss'),
})
