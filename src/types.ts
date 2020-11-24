import * as Babel from '@babel/core'
import { Theme } from '@theme-ui/css'
import { MacroParams } from 'babel-plugin-macros'

export type MacroHandlerParams = Omit<MacroParams, 'config'> & {
  config?: {
    plugins?: Plugin[]
  }
}

export type Plugin = (
  nodePath: Babel.NodePath<Babel.Node>,
  theme: Theme,
  babel: typeof Babel
) => void
