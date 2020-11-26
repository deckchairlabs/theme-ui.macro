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

function createObjectTypeLiteralNode(object: object) {
  const propertySignatures: ts.PropertySignature[] = Object.entries(object)
    .map(([key, value]) => {
      const identifier = ts.factory.createIdentifier(key)
      let typeNode = undefined

      if (Array.isArray(value)) {
        const elements = value
          .map((element) => {
            switch (typeof element) {
              case 'boolean':
                return element
                  ? ts.factory.createTrue()
                  : ts.factory.createFalse()
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
        typeNode = ts.factory.createTupleTypeNode(elements)
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
            typeNode = createObjectTypeLiteralNode(value)
            break
        }
      }

      if (typeNode) {
        return ts.factory.createPropertySignature(
          undefined,
          identifier,
          undefined,
          typeNode
        )
      }
    })
    .filter(notUndefined)

  return ts.factory.createTypeLiteralNode(propertySignatures)
}

function createModuleDeclaration(theme: Theme) {
  console.log(theme)

  const interfaceMembers: ts.TypeElement[] = Object.entries(theme)
    .map(([key, value]) => {
      switch (typeof value) {
        case 'object':
          return ts.factory.createPropertySignature(
            undefined,
            ts.factory.createIdentifier(key),
            undefined,
            createObjectTypeLiteralNode(value)
          )
          break
      }
    })
    .filter(notUndefined)

  const moduleBlock = ts.factory.createModuleBlock([
    ts.factory.createInterfaceDeclaration(
      undefined,
      [ts.createToken(ts.SyntaxKind.ExportKeyword)],
      ts.factory.createIdentifier('Theme'),
      undefined,
      undefined,
      interfaceMembers
    ),
  ])

  return ts.factory.createModuleDeclaration(
    undefined,
    [ts.createToken(ts.SyntaxKind.DeclareKeyword)],
    ts.factory.createStringLiteral('@theme-ui/css'),
    moduleBlock
  )
  // const functionName = ts.createIdentifier('factorial')
  // const paramName = ts.createIdentifier('n')
  // const parameter = ts.createParameter(
  //   /*decorators*/ undefined,
  //   /*modifiers*/ undefined,
  //   /*dotDotDotToken*/ undefined,
  //   paramName
  // )

  // const condition = ts.createBinary(
  //   paramName,
  //   ts.SyntaxKind.LessThanEqualsToken,
  //   ts.createLiteral(1)
  // )
  // const ifBody = ts.createBlock(
  //   [ts.createReturn(ts.createLiteral(1))],
  //   /*multiline*/ true
  // )

  // const decrementedArg = ts.createBinary(
  //   paramName,
  //   ts.SyntaxKind.MinusToken,
  //   ts.createLiteral(1)
  // )
  // const recurse = ts.createBinary(
  //   paramName,
  //   ts.SyntaxKind.AsteriskToken,
  //   ts.createCall(functionName, /*typeArgs*/ undefined, [decrementedArg])
  // )
  // const statements = [ts.createIf(condition, ifBody), ts.createReturn(recurse)]

  // return ts.createFunctionDeclaration(
  //   /*decorators*/ undefined,
  //   /*modifiers*/ [ts.createToken(ts.SyntaxKind.ExportKeyword)],
  //   /*asteriskToken*/ undefined,
  //   functionName,
  //   /*typeParameters*/ undefined,
  //   [parameter],
  //   /*returnType*/ ts.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword),
  //   ts.createBlock(statements, /*multiline*/ true)
  // )
}
