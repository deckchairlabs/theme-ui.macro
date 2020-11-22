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
      plugins: [postcss({ foo: 'bar' })],
    },
  },
  tests: [
    {
      title: 'passed theme object inline',
      code: `
        import transformTheme from '../macro'
        const fonts = {
          body: 'system-ui, sans-serif',
          heading: 'system-ui, sans-serif',
          monospace: 'Menlo, monospace',
        }
        const scale = {
          space: [0, 4, 8, 16]
        }
        export default transformTheme({
          colors: {
            primary: 'red'
          },
          ...scale,
          fonts,
          stringLiteral: {
            fontSize: '36px',
          },
          scale: {
            margin: 1,
          },
          responsiveScale: {
            padding: [0, 2]
          },
          buttons: {
            '@selector': '.button',
            primary: {
              backgroundColor: 'primary'
            }
          }
        })
      `,
      output: `export default {
  colors: {
    primary: 'red',
  },
  space: [0, 4, 8, 16],
  fonts: {
    body: 'system-ui, sans-serif',
    heading: 'system-ui, sans-serif',
    monospace: 'Menlo, monospace',
  },
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
