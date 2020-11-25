import fs from 'fs'
import { dirname } from 'path'
import * as Babel from '@babel/core'
import { NodePath, Node, Binding } from '@babel/traverse'
import {
  isFile,
  isIdentifier,
  isExportNamedDeclaration,
  isImportDeclaration,
  isImportSpecifier,
  isStringLiteral,
  isVariableDeclarator,
  ObjectExpression,
  isVariableDeclaration,
  isExportDefaultDeclaration,
  objectProperty,
  identifier,
  isObjectExpression,
} from '@babel/types'

export default function resolveBindings(
  nodePath: NodePath<ObjectExpression>,
  babel: typeof Babel,
  filename: string
) {
  resolveImports(nodePath, babel, filename)

  const bindings = nodePath.scope.getAllBindings()

  Object.keys(bindings).forEach((key) => {
    const binding = nodePath.scope.getBinding(key)
    if (binding) {
      binding.referencePaths.forEach((reference) => {
        switch (binding.path.node?.type) {
          case 'VariableDeclarator':
            resolveVariableDeclaratorBinding(binding, reference)
            break
        }
      })
    }
  })

  return nodePath
}

export function resolveImports(
  nodePath: NodePath<ObjectExpression>,
  babel: typeof Babel,
  filename: string
) {
  nodePath.traverse({
    ObjectProperty: {
      enter(path) {
        if (isIdentifier(path.node.value)) {
          const objectPropertyPath = path
          const identifierName = path.node.value.name
          const binding = nodePath.scope.getBinding(identifierName)
          if (
            binding &&
            isImportSpecifier(binding.path.node) &&
            isImportDeclaration(binding.path.parentPath.node) &&
            isStringLiteral(binding.path.parentPath.node.source)
          ) {
            const importFilePath = require.resolve(
              binding.path.parentPath.node.source.value,
              {
                paths: [dirname(filename)],
              }
            )

            try {
              const buffer = fs.readFileSync(importFilePath)
              const ast = babel.parseSync(buffer.toString(), {
                filename: importFilePath,
              })

              if (ast && isFile(ast)) {
                const importSpecifiers = binding.path.parentPath.node.specifiers

                ast.program.body.forEach((statement) => {
                  if (
                    (isExportNamedDeclaration(statement) ||
                      isExportDefaultDeclaration(statement)) &&
                    isVariableDeclaration(statement.declaration)
                  ) {
                    const declarations = statement.declaration.declarations
                    const variableDeclarations = importSpecifiers.map(
                      (specifier) => {
                        if (
                          isImportSpecifier(specifier) &&
                          isIdentifier(declarations[0].id)
                        ) {
                          return declarations.find((declaration) => {
                            if (
                              isIdentifier(declaration.id) &&
                              isIdentifier(specifier.imported)
                            ) {
                              return (
                                declaration.id.name === specifier.imported.name
                              )
                            }
                          })
                        }
                      }
                    )

                    if (
                      variableDeclarations[0] &&
                      isObjectExpression(variableDeclarations[0].init)
                    ) {
                      objectPropertyPath.replaceWith(
                        objectProperty(
                          identifier(identifierName),
                          variableDeclarations[0].init
                        )
                      )
                    }
                  }
                })

                // Remove the import binding
                binding.path.parentPath.remove()
              }
            } catch (error) {
              console.error(error)
            }
          }
        }
      },
    },
  })
}

export function resolveVariableDeclaratorBinding(
  binding: Binding,
  reference: NodePath<Node>
) {
  if (isVariableDeclarator(binding.path.node) && binding.path.node.init) {
    reference.replaceWith(binding.path.node.init)
  }
  binding.path.remove()
}
