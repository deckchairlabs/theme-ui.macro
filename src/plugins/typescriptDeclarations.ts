import * as fs from 'fs'
import * as Babel from '@babel/core'
import { Theme } from '@theme-ui/css'
import { Plugin } from '../types'

type TypescriptDeclarationsPluginConfig = {}

export default function TypescriptDeclarationsPlugin(
  config?: TypescriptDeclarationsPluginConfig
): Plugin {
  return (
    path: Babel.NodePath<Babel.Node>,
    theme: Theme,
    babel: typeof Babel
  ) => {
    // 1. Check if AST is Typescript, throw MacroError if not
    // 2. Traverse the tree and create matching Typescript Declaration AST
    // 3. Write the result out to file eg theme.d.ts
    console.log(theme)
  }
}
