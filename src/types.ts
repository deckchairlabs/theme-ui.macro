import * as Babel from '@babel/core'
import { MacroParams } from 'babel-plugin-macros'

export type MacroHandlerParams = Omit<MacroParams, 'config'> & {
  config?: {
    plugins?: Plugin[]
  }
}

export type Plugin = (
  expression: Babel.types.ObjectExpression,
  babel: typeof Babel
) => void
