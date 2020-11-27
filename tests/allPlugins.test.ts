import fs from 'fs'
import path from 'path'
import pluginTester from 'babel-plugin-tester'
import plugin from 'babel-plugin-macros'

pluginTester({
  plugin,
  pluginName: 'theme-ui.macro',
  title: 'All Plugins',
  snapshot: false,
  babelOptions: {
    presets: ['@babel/preset-typescript'],
    filename: __filename,
  },
  pluginOptions: {
    themeUI: {
      customProperties: {},
      generateStylesheet: {
        selectors: { buttons: '.button', layout: '.layout' },
        output: path.resolve(__dirname, 'generated/theme-all.css'),
      },
      generateTSDeclaration: {
        output: path.join(__dirname, 'generated/theme-all.d.ts'),
      },
    },
  },
  fixtures: path.join(__dirname, 'plugins/allPlugins'),
})

test('generated stylesheet matches snapshot', () => {
  const content = fs.readFileSync(
    path.resolve(__dirname, 'generated/theme-all.css')
  )
  expect(content.toString()).toMatchSnapshot()
})

test('generated declaration file matches snapshot', () => {
  const content = fs.readFileSync(
    path.resolve(__dirname, 'generated/theme-all.d.ts')
  )
  expect(content.toString()).toMatchSnapshot()
})
