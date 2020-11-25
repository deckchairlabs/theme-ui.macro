import transformTheme from '../../../macro'

import scales from './scales'
import { colors } from './tokens'

export default transformTheme({
    colors,
    ...scales,
    buttons: {
        base: {
            padding: 2
        }
    }
})