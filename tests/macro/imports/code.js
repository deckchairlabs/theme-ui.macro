import transformTheme from '../../../macro'

import { colors } from './tokens'

export default transformTheme({
    colors,
    buttons: {
        base: {
            padding: 2
        }
    }
})