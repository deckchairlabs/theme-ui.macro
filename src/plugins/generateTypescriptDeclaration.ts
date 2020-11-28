import * as fs from 'fs'
import * as Babel from '@babel/core'
import { Theme } from '@theme-ui/css'
import * as ts from 'typescript'
import { Plugin, GenerateTypescriptDeclarationPluginConfig } from '../types'
import { notUndefined } from '../utils'

export default function GenerateTypescriptDeclarationPlugin(
  config: GenerateTypescriptDeclarationPluginConfig
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

    const result = printer.printList(
      ts.ListFormat.MultiLine,
      createModuleDeclaration(theme),
      resultFile
    )

    fs.writeFileSync(config.output, result)
  }
}

function createModuleDeclaration(theme: Theme) {
  const declaredModuleName = '@theme-ui/css'

  /**
   * We create an import node so we opt-out of "ambient" mode for this declaration
   */
  const importDeclaration = ts.factory.createImportDeclaration(
    undefined,
    undefined,
    ts.factory.createImportClause(
      false,
      undefined,
      ts.factory.createNamedImports([
        ts.factory.createImportSpecifier(
          undefined,
          ts.factory.createIdentifier('Theme')
        ),
      ])
    ),
    createStringLiteral(declaredModuleName)
  )

  const interfaceMembers: ts.TypeElement[] = Object.entries(theme)
    .map(([key, value]) =>
      createPropertySignature(key, createLiteralTypeNodes(value))
    )
    .filter(notUndefined)

  const moduleBlock = ts.factory.createModuleBlock([
    ts.factory.createInterfaceDeclaration(
      undefined,
      [createExportToken()],
      createIdentifier('Theme'),
      undefined,
      undefined,
      interfaceMembers
    ),
  ])

  const moduleDeclaration = ts.factory.createModuleDeclaration(
    undefined,
    [createDeclareToken()],
    createStringLiteral(declaredModuleName),
    moduleBlock
  )

  return ts.factory.createNodeArray([importDeclaration, moduleDeclaration])
}

function createTupleTypeNodeFromArray(array: Array<any>) {
  const elements = array
    .map(createLiteralFromPrimitive)
    .filter(notUndefined)
    .map((literal) => ts.factory.createLiteralTypeNode(literal))

  return ts.factory.createTupleTypeNode(elements)
}

function createLiteralFromPrimitive(primitive: any) {
  switch (typeof primitive) {
    case 'boolean':
      return primitive ? ts.factory.createTrue() : ts.factory.createFalse()
    case 'string':
      return createStringLiteral(primitive)
    case 'number':
      return ts.factory.createNumericLiteral(primitive)
    case 'bigint':
      return ts.factory.createBigIntLiteral(String(primitive))
  }
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
        if (typeof value === 'object') {
          typeNode = createLiteralTypeNodes(value)
        } else {
          const literal = createLiteralFromPrimitive(value)
          if (literal) {
            typeNode = ts.factory.createLiteralTypeNode(literal)
          }
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
    readonly ? [createReadonlyToken()] : undefined,
    createIdentifier(identifier),
    undefined,
    typeNode
  )
}

function createExportToken() {
  return ts.factory.createToken(ts.SyntaxKind.ExportKeyword)
}

function createDeclareToken() {
  return ts.factory.createToken(ts.SyntaxKind.DeclareKeyword)
}

function createReadonlyToken() {
  return ts.factory.createToken(ts.SyntaxKind.ReadonlyKeyword)
}

function createIdentifier(value: string) {
  return ts.factory.createIdentifier(value)
}

function createStringLiteral(value: string) {
  return ts.factory.createStringLiteral(value)
}
