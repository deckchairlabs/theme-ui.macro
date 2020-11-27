import path from 'path'
import pluginTester from 'babel-plugin-tester'
import plugin from 'babel-plugin-macros'

pluginTester({
  plugin,
  pluginName: 'theme-ui.macro',
  title: 'Macro',
  snapshot: false,
  babelOptions: {
    presets: ['@babel/preset-typescript'],
    filename: __filename,
  },
  fixtures: path.join(__dirname, 'macro'),
})
