import fs from 'fs'
import path from 'path'
import pluginTester from 'babel-plugin-tester'
import plugin from 'babel-plugin-macros'

pluginTester({
  plugin,
  pluginName: 'theme-ui.macro',
  title: 'Generate Stylesheet',
  snapshot: false,
  babelOptions: {
    presets: ['@babel/preset-typescript'],
    filename: __filename,
  },
  pluginOptions: {
    themeUI: {
      generateStylesheet: {
        selectors: { buttons: '.button', layout: '.layout' },
        output: path.resolve(__dirname, 'generated/theme.css'),
      },
    },
  },
  fixtures: path.join(__dirname, 'plugins/generateStylesheet'),
})

test('generated stylesheet matches snapshot', () => {
  const content = fs.readFileSync(
    path.resolve(__dirname, 'generated/theme.css')
  )
  expect(content.toString()).toMatchSnapshot()
})
