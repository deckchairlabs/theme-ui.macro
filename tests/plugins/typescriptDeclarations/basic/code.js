import transformTheme from '../../../../macro'

export default transformTheme({
    colors: {
        primary: 'red',
        secondary: 'blue',
        black: '#000',
        highlight: 'colors.primary'
    },
    space: [0, 4, 8, 16],
    buttons: {
        base: {
            padding: [2, 3]
        }
    }
})