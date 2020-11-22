import transformTheme from '../../../../macro'

export default transformTheme({
    colors: {
        primary: 'red',
        secondary: 'blue',
        black: '#000'
    },
    space: [0, 4, 8, 16],
    layout: {
        spacing: {
            large: {
                margin: 3
            }
        },
    },
    buttons: {
        base: {
            padding: 2,
            paddingBottom: 3,
        },
        primary: {
            backgroundColor: 'primary'
        }
    }
})