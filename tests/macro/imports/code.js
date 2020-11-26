import transformTheme from '../../../macro'

// default import
import buttons from './buttons'
// namespace import
import * as typography from './typography'
// named imports
import { colors, space } from './tokens'

export default transformTheme({
    colors,
    space,
    buttons,
    ...typography,
    asPropertyFromNamespace: typography.fontWeights,
    nested: {
        ...typography
    }
})