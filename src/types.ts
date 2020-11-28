import * as Babel from '@babel/core'
import { Theme } from '@theme-ui/css'
import { MacroParams } from 'babel-plugin-macros'

export type MacroHandlerParams = Omit<MacroParams, 'config'> & {
  config?: {
    customProperties?: CustomPropertiesPluginConfig
    generateStylesheet?: GenerateStylesheetPluginConfig
    generateTypeScriptDeclaration?: GenerateTypescriptDeclarationPluginConfig
  }
}

export type Plugin = (
  nodePath: Babel.NodePath<Babel.Node>,
  theme: Theme,
  babel: typeof Babel,
  relativeFilepath: string
) => void

export type CustomPropertiesPluginConfig = {
  prefix?: string
}

export type GenerateStylesheetPluginConfig = {
  output: string
  selectors: Record<string, string>
  selectorSeparator?: string
}

export type GenerateTypescriptDeclarationPluginConfig = {
  output: string
}
