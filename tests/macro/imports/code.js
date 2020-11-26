import transformTheme from '../../../macro'

import { colors, space } from './tokens'

export default transformTheme({
    colors,
    space,
    buttons: {
        base: {
            padding: 2
        }
    }
})