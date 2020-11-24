import transformTheme from '../../../../macro'

export default transformTheme({
    styles: {
        root: {
            '--colors-primary': 'red'
        }
    },
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
            p: 3,
            paddingX: 2,
        },
        primary: {
            backgroundColor: 'primary'
        }
    }
})