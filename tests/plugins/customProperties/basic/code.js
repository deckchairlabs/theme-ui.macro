import transformTheme from '../../../../macro'

export default transformTheme({
    colors: {
        primary: 'red',
        secondary: 'blue',
        black: '#000',
        dark: {
            primary: 'white'
        }
    },
    space: [0, 4, 8, 16],
    borderWidths: [0, 1, 2],
    layout: {
        spacing: {
            large: {
                margin: 3
            }
        },
    },
    buttons: {
        base: {
            p: 3,
            paddingX: 2,
            borderWidth: 1
        },
        primary: {
            backgroundColor: 'primary'
        }
    }
})