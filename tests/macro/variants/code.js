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
            padding: 2
        },
        primary: {
            padding: [2, 4],
            backgroundColor: 'primary'
        }
    }
})