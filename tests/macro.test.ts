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
      code: `
        import transformTheme from '../macro'
        export default transformTheme({
          colors: {
            primary: 'red',
          },
          space: [0, 4, 8, 16],
          buttons: {
            base: {
              bg: 'blue',
              color: 'primary'
            },
            primary: {
              variant: 'buttons.base',
              padding: [0, 2, 3],
              margin: '8px',
              backgroundColor: 'primary',
              '--custom': 'space.2'
            },
            extended: {
              '@apply': 'buttons.base',
              padding: 2
            }
          }
        })
      `,
      output: `export default {
  colors: {
    primary: 'red',
  },
  space: [0, 4, 8, 16],
  buttons: {
    base: {
      bg: 'blue',
      color: 'var(--colors-primary)',
    },
    primary: {
      variant: 'buttons.base',
      padding: ['var(--space-0)', 'var(--space-2)', 'var(--space-3)'],
      margin: '8px',
      backgroundColor: 'var(--colors-primary)',
      '--custom': 'var(--space-2)',
    },
    extended: {
      ...{
        bg: 'blue',
        color: 'var(--colors-primary)',
      },
      padding: 'var(--space-2)',
    },
  },
}`,
    },
  ],
})
