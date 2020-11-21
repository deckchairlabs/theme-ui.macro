import pluginTester from 'babel-plugin-tester'
import plugin from 'babel-plugin-macros'

pluginTester({
  plugin,
  pluginName: 'theme-ui.macro',
  snapshot: false,
  babelOptions: {
    presets: [['@babel/preset-typescript']],
    filename: __filename,
  },
  tests: [
    {
      title: 'passed theme object inline',
      code: `
        import transformTheme from '../macro'
        export default transformTheme({
          colors: {
            primary: 'red'
          },
          space: [0, 4, 8, 16],
          stringLiteral: {
            fontSize: '36px',
          },
          scale: {
            margin: 1,
          },
          responsiveScale: {
            padding: [0, 2]
          }
        })
      `,
      output: `export default {
  colors: {
    primary: 'red',
  },
  space: [0, 4, 8, 16],
  stringLiteral: {
    fontSize: '36px',
  },
  scale: {
    margin: 'var(--space-1)',
  },
  responsiveScale: {
    padding: ['var(--space-0)', 'var(--space-2)'],
  },
}`,
    },
  ],
})
