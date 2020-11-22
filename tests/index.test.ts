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
      plugins: [postcss({ foo: 'bar' })],
    },
  },
  fixtures: path.join(__dirname, 'fixtures'),
  //   tests: [
  //     {
  //       title: 'passed theme object inline',
  //       code: `
  //         import transformTheme from '../macro'
  //         const fonts = {
  //           body: 'system-ui, sans-serif',
  //           heading: 'system-ui, sans-serif',
  //           monospace: 'Menlo, monospace',
  //         }
  //         const scale = {
  //           space: [0, 4, 8, 16, '50%', .333333]
  //         }
  //         export default transformTheme({
  //           colors: {
  //             primary: 'red',
  //             secondary: 'blue',
  //             black: '#000',
  //           },
  //           ...scale,
  //           fonts,
  //           stringLiteral: {
  //             fontSize: '36px',
  //           },
  //           scale: {
  //             margin: 1,
  //           },
  //           responsiveScale: {
  //             padding: [0, 2]
  //           },
  //           buttons: {
  //             '@selector': '.button',
  //             base: {
  //               padding: 2
  //             },
  //             primary: {
  //               '@apply': 'buttons.base',
  //               backgroundColor: 'primary'
  //             },
  //             secondary: {
  //               backgroundColor: 'secondary'
  //             }
  //           }
  //         })
  //       `,
  //       output: `export default {
  //   ':root': {
  //     '--colors-primary': 'red',
  //     '--colors-secondary': 'blue',
  //     '--colors-black': '#000',
  //     '--space-0': '0px',
  //     '--space-1': '4px',
  //     '--space-2': '8px',
  //     '--space-3': '16px',
  //     '--space-4': '50%',
  //     '--space-5': '33.3333%',
  //   },
  //   colors: {
  //     primary: 'red',
  //     secondary: 'blue',
  //     black: '#000',
  //   },
  //   space: [0, 4, 8, 16, '50%', 0.333333],
  //   fonts: {
  //     body: 'system-ui, sans-serif',
  //     heading: 'system-ui, sans-serif',
  //     monospace: 'Menlo, monospace',
  //   },
  //   stringLiteral: {
  //     fontSize: '36px',
  //   },
  //   scale: {
  //     margin: 'var(--space-1)',
  //   },
  //   responsiveScale: {
  //     padding: ['var(--space-0)', 'var(--space-2)'],
  //   },
  //   buttons: {
  //     base: {
  //       padding: 'var(--space-2)',
  //     },
  //     primary: {
  //       ...{
  //         padding: 'var(--space-2)',
  //       },
  //       backgroundColor: 'var(--colors-primary)',
  //     },
  //     secondary: {
  //       backgroundColor: 'var(--colors-secondary)',
  //     },
  //   },
  // }`,
  //     },
  // ],
})
