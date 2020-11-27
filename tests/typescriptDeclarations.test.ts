import fs from 'fs'
import path from 'path'
import pluginTester from 'babel-plugin-tester'
import plugin from 'babel-plugin-macros'

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
      generateTSDeclaration: {
        output: path.join(__dirname, 'generated/theme.d.ts'),
      },
    },
  },
  fixtures: path.join(__dirname, 'plugins/typescriptDeclarations'),
})

test('generated declaration file matches snapshot', () => {
  const content = fs.readFileSync(
    path.resolve(__dirname, 'generated/theme.d.ts')
  )
  expect(content.toString()).toMatchSnapshot()
})
