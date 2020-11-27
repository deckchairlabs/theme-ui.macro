import path from 'path'
import pluginTester from 'babel-plugin-tester'
import plugin from 'babel-plugin-macros'
import customProperties from '../src/plugins/customProperties'

pluginTester({
  plugin,
  pluginName: 'theme-ui.macro',
  title: 'Custom Properties',
  snapshot: false,
  babelOptions: {
    presets: ['@babel/preset-typescript'],
    filename: __filename,
  },
  pluginOptions: {
    themeUI: {
      plugins: [customProperties()],
    },
  },
  fixtures: path.join(__dirname, 'plugins/customProperties'),
})
