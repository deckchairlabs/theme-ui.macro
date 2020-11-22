import transformTheme from '../../../macro'

export default transformTheme({
    colors: {
        primary: 'red',
        secondary: 'blue',
        black: '#000'
    },
    space: [0, 4, 8, 16, '50%', 0.4]
})

export const theme = transformTheme({
    colors: {
        primary: 'red'
    }
})