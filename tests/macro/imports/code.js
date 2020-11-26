import transformTheme from '../../../macro'

import buttons from './buttons'
import * as typography from './typography'
import { colors, space } from './tokens'

export default transformTheme({
    colors,
    space,
    buttons,
    ...typography
})