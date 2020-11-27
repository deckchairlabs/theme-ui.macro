import transformTheme from '../../../macro'

export default transformTheme({
  colors: {
    primary: 'red',
    secondary: 'blue',
    black: '#000'
  },
  space: [0, 4, 8, 16],
  buttons: {
    base: {
      paddingY: 2,
      paddingX: 3
    },
    primary: {
      '@apply': 'buttons.base'
    }
  }
})