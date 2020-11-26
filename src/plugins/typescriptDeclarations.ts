import * as fs from 'fs'
import * as Babel from '@babel/core'
import { Theme } from '@theme-ui/css'
import * as ts from 'typescript'
import { Plugin } from '../types'
import { notUndefined } from '../utils'

type TypescriptDeclarationsPluginConfig = {
  output: string
}

export default function TypescriptDeclarationsPlugin(
  config: TypescriptDeclarationsPluginConfig
): Plugin {
  return (
    path: Babel.NodePath<Babel.Node>,
    theme: Theme,
    babel: typeof Babel
  ) => {
    const resultFile = ts.createSourceFile(
      'declaration.d.ts',
      '',
      ts.ScriptTarget.Latest,
      /*setParentNodes*/ false,
      ts.ScriptKind.TS
    )

    const printer = ts.createPrinter({
      newLine: ts.NewLineKind.LineFeed,
    })

    const result = printer.printNode(
      ts.EmitHint.Unspecified,
      createModuleDeclaration(theme),
      resultFile
    )

    console.log(result)

    fs.writeFileSync(config.output, result)
  }
}

function createModuleDeclaration(theme: Theme) {
  const interfaceMembers: ts.TypeElement[] = Object.entries(theme)
    .map(([key, value]) => {
      let typeNode = createLiteralTypeNodes(value)

      return createPropertySignature(key, typeNode)
    })
    .filter(notUndefined)

  const moduleBlock = ts.factory.createModuleBlock([
    ts.factory.createInterfaceDeclaration(
      undefined,
      [createExportToken()],
      ts.factory.createIdentifier('Theme'),
      undefined,
      undefined,
      interfaceMembers
    ),
  ])

  return ts.factory.createModuleDeclaration(
    undefined,
    [ts.factory.createToken(ts.SyntaxKind.DeclareKeyword)],
    ts.factory.createStringLiteral('@theme-ui/css'),
    moduleBlock
  )
}

function createExportToken() {
  return ts.factory.createToken(ts.SyntaxKind.ExportKeyword)
}

function createTupleTypeNodeFromArray(array: Array<any>) {
  const elements = array
    .map((element) => {
      switch (typeof element) {
        case 'boolean':
          return element ? ts.factory.createTrue() : ts.factory.createFalse()
        case 'string':
          return ts.factory.createStringLiteral(element)
        case 'number':
          return ts.factory.createNumericLiteral(element)
        case 'bigint':
          return ts.factory.createBigIntLiteral(String(element))
      }
    })
    .filter(notUndefined)
    .map((literal) => ts.factory.createLiteralTypeNode(literal))

  return ts.factory.createTupleTypeNode(elements)
}

function createLiteralTypeNodes(object: object | Array<any>) {
  if (Array.isArray(object)) {
    return createTupleTypeNodeFromArray(object)
  }

  const propertySignatures: ts.PropertySignature[] = Object.entries(object)
    .map(([key, value]) => {
      let typeNode = undefined

      if (Array.isArray(value)) {
        typeNode = createTupleTypeNodeFromArray(value)
      } else {
        switch (typeof value) {
          case 'string':
            typeNode = ts.factory.createLiteralTypeNode(
              ts.factory.createStringLiteral(value)
            )
            break
          case 'number':
            typeNode = ts.factory.createLiteralTypeNode(
              ts.factory.createNumericLiteral(value)
            )
            break
          case 'object':
            typeNode = createLiteralTypeNodes(value)
            break
        }
      }

      if (typeNode) {
        return createPropertySignature(key, typeNode)
      }
    })
    .filter(notUndefined)

  return ts.factory.createTypeLiteralNode(propertySignatures)
}

function createPropertySignature(
  identifier: string,
  typeNode: ts.TypeNode,
  readonly?: boolean
) {
  return ts.factory.createPropertySignature(
    readonly
      ? [ts.factory.createToken(ts.SyntaxKind.ReadonlyKeyword)]
      : undefined,
    ts.factory.createIdentifier(identifier),
    undefined,
    typeNode
  )
}
