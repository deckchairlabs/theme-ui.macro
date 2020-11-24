import transformTheme from '../../../macro'

export const colors = {
    primary: 'red',
    secondary: 'blue'
}

export default transformTheme({
    colors,
    space: [0, 4, 8, 16, '50%', 0.4]
})