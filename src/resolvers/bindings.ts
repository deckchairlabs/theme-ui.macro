import fs from 'fs'
import { dirname } from 'path'
import * as Babel from '@babel/core'
import traverse, { NodePath, Node, Binding } from '@babel/traverse'
import {
  isIdentifier,
  isExportNamedDeclaration,
  isVariableDeclarator,
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
  babel: typeof Babel,
  state: Babel.PluginPass
) {
  resolveImportBindings(state.file.ast, babel, state)
  resolveLocalVariableDeclaratorBindings(state.file.ast, babel, state)
}

export function resolveLocalVariableDeclaratorBindings(
  ast: Babel.types.Program | Babel.types.File | null,
  babel: typeof Babel,
  state: Babel.PluginPass
) {
  const bindings = state.file.scope.getAllBindings()

  Object.keys(bindings).forEach((key) => {
    const binding = state.file.scope.getBinding(key)
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
  ast: Babel.types.Program | Babel.types.File | null,
  babel: typeof Babel,
  state: Babel.PluginPass
) {
  const filename = state.filename

  traverse(ast, {
    ImportDeclaration: {
      enter(path) {
        const source = path.node.source.value

        const filepath = resolveImportFilepath(source, dirname(filename))
        const importedAst = parseAstFromFile(filepath, babel)
        const moduleExports = getExportedExpressions(importedAst)

        if (moduleExports.size > 0) {
          path.node.specifiers.forEach((specifier) => {
            const binding = state.file.scope.getBinding(specifier.local.name)

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
                      case 'MemberExpression':
                        if (
                          babel.types.isIdentifier(
                            referencePath.parentPath.node.property
                          ) &&
                          babel.types.isObjectExpression(resolvedImport)
                        ) {
                          const propertyName =
                            referencePath.parentPath.node.property.name
                          const memberExpressionProperty = resolvedImport.properties.find(
                            (property) => {
                              return (
                                babel.types.isObjectProperty(property) &&
                                babel.types.isIdentifier(property.key) &&
                                property.key.name === propertyName
                              )
                            }
                          )
                          if (
                            babel.types.isObjectProperty(
                              memberExpressionProperty
                            )
                          ) {
                            referencePath.parentPath.replaceWith(
                              memberExpressionProperty.value
                            )
                          }
                        }
                        break
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

function resolveImportFilepath(source: string, path: string) {
  return require.resolve(source, {
    paths: [path],
  })
}

function parseAstFromFile(filepath: string, babel: typeof Babel) {
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
