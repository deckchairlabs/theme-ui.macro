import transformTheme from '../../../macro'

// default import
import * as components from './components'
// namespace import
import * as typography from './typography'
// named imports
import { colors, space } from './tokens'

export default transformTheme({
    colors,
    space,
    ...components,
    ...typography,
    memberProperty: typography.fontWeights,
    nestedSpread: {
        ...typography
    }
})