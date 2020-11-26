import fs from 'fs'
import { dirname } from 'path'
import * as Babel from '@babel/core'
import traverse, { NodePath, Node, Binding } from '@babel/traverse'
import {
  isIdentifier,
  isExportNamedDeclaration,
  isVariableDeclarator,
  ObjectExpression,
  isVariableDeclaration,
  isExportDefaultDeclaration,
  isExpression,
  ImportSpecifier,
  ImportDefaultSpecifier,
  ImportNamespaceSpecifier,
  isObjectExpression,
  isObjectProperty,
} from '@babel/types'

export default function resolveBindings(
  nodePath: NodePath<ObjectExpression>,
  babel: typeof Babel,
  state: Babel.PluginPass
) {
  resolveImportBindings(nodePath, babel, state)
  resolveLocalVariableDeclaratorBindings(nodePath, babel, state)
}

export function resolveLocalVariableDeclaratorBindings(
  nodePath: NodePath<ObjectExpression>,
  babel: typeof Babel,
  state: Babel.PluginPass
) {
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
}

export function resolveImportBindings(
  nodePath: NodePath<ObjectExpression>,
  babel: typeof Babel,
  state: Babel.PluginPass
) {
  const filename = state.filename
  const ast = state.file.ast

  traverse(ast, {
    ImportDeclaration: {
      enter(path) {
        const source = path.node.source.value

        const importedAst = parseAstFromFile(source, dirname(filename), babel)
        const moduleExports = getExportedExpressions(importedAst)

        if (moduleExports.size > 0) {
          path.node.specifiers.forEach((specifier) => {
            const binding = nodePath.scope.getBinding(specifier.local.name)

            let resolvedImport: Babel.types.Expression | undefined

            if (binding) {
              switch (specifier.type) {
                case 'ImportNamespaceSpecifier':
                  const namespaceExports = Array.from(moduleExports.entries())
                  const objectProperties: Babel.types.ObjectProperty[] = namespaceExports.map(
                    ([key, value]) => {
                      return babel.types.objectProperty(
                        babel.types.identifier(key),
                        value
                      )
                    }
                  )

                  resolvedImport = babel.types.objectExpression(
                    objectProperties
                  )
                  break
                case 'ImportDefaultSpecifier':
                  resolvedImport = moduleExports.get('default')
                  break
                case 'ImportSpecifier':
                  resolvedImport = moduleExports.get(specifier.local.name)
                  break
              }

              if (resolvedImport) {
                binding.referencePaths.forEach((referencePath) => {
                  if (
                    babel.types.isIdentifier(referencePath.node) &&
                    babel.types.isExpression(resolvedImport)
                  ) {
                    switch (referencePath.parentPath.node.type) {
                      case 'ObjectProperty':
                        resolveImportSpecifier(
                          specifier,
                          resolvedImport,
                          referencePath.parentPath
                        )

                        break

                      case 'SpreadElement':
                        if (
                          typeof referencePath.parentPath.key === 'number' &&
                          babel.types.isObjectExpression(
                            referencePath.parentPath.parentPath.node
                          ) &&
                          babel.types.isObjectExpression(resolvedImport)
                        ) {
                          referencePath.parentPath.replaceWithMultiple(
                            resolvedImport.properties
                          )
                        }
                        break
                    }
                  }
                })
              }
            }
          })

          path.remove()
        }
      },
    },
  })
}

export function resolveImportSpecifier(
  specifier:
    | ImportSpecifier
    | ImportDefaultSpecifier
    | ImportNamespaceSpecifier,
  expression: Babel.types.Expression,
  path: Babel.NodePath<Babel.Node>
) {
  if (specifier.type === 'ImportDefaultSpecifier') {
    if (isObjectExpression(expression)) {
      path.replaceWithMultiple(expression.properties)
    } else {
      path.replaceWith(expression)
    }
  } else if (isObjectProperty(path.node)) {
    path.node.value = expression
  }
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

function parseAstFromFile(source: string, path: string, babel: typeof Babel) {
  // Resolve the path to the module import
  const filepath = require.resolve(source, {
    paths: [path],
  })

  const buffer = fs.readFileSync(filepath)
  const ast = babel.parseSync(buffer.toString(), {
    filename: filepath,
  })

  return ast
}

function getExportedExpressions(
  ast: Babel.types.Program | Babel.types.File | null
) {
  const moduleExports: Map<string, Babel.types.Expression> = new Map()

  // Extract all the export declarations from the AST
  traverse(ast, {
    ExportDeclaration: {
      enter(exportDeclaration) {
        // Handle default exports
        if (
          isExportDefaultDeclaration(exportDeclaration.node) &&
          isExpression(exportDeclaration.node.declaration)
        ) {
          moduleExports.set('default', exportDeclaration.node.declaration)
        } else if (
          isExportNamedDeclaration(exportDeclaration.node) &&
          isVariableDeclaration(exportDeclaration.node.declaration)
        ) {
          exportDeclaration.node.declaration.declarations.forEach(
            (variableDeclaration) => {
              if (
                isIdentifier(variableDeclaration.id) &&
                variableDeclaration.init
              ) {
                moduleExports.set(
                  variableDeclaration.id.name,
                  variableDeclaration.init
                )
              }
            }
          )
        }
      },
    },
  })

  return moduleExports
}
