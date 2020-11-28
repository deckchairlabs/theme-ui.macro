import fs from 'fs'
import { dirname } from 'path'
import * as Babel from '@babel/core'
import traverse from '@babel/traverse'
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
  objectExpression,
  objectProperty,
  identifier,
} from '@babel/types'

export default function resolveReferences(
  babel: typeof Babel,
  state: Babel.PluginPass
) {
  resolveImportReferences(babel, state.file.ast, state.filename)
  resolveLocalVariableReferences(state.file.ast, state)
}

export function resolveLocalVariableReferences(
  ast: Babel.Node | null,
  state: Babel.PluginPass
) {
  const bindings = state.file.scope.getAllBindings()

  Object.keys(bindings).forEach((key) => {
    const binding = state.file.scope.getBinding(key)
    if (binding) {
      binding.referencePaths.forEach((referencePath) => {
        switch (binding.path.node?.type) {
          case 'VariableDeclarator':
            resolveVariableDeclaratorReference(binding.path, referencePath)
            break
        }
      })
    }
  })
}

export function resolveImportReferences(
  babel: typeof Babel,
  ast: Babel.Node | null,
  filename: string
) {
  traverse(ast, {
    ImportDeclaration: {
      enter(path) {
        const source = path.node.source.value

        const filepath = resolveImportFilepath(source, dirname(filename))
        const importedAst = parseAstFromFile(babel, filepath)
        const moduleExports = resolveModuleExports(importedAst)

        // resolveImports(importedAst, babel, source)

        if (moduleExports.size > 0) {
          path.node.specifiers.forEach((specifier) => {
            const binding = path.scope.getBinding(specifier.local.name)
            if (binding) {
              const resolvedImport = resolveImport(specifier, moduleExports)

              if (resolvedImport) {
                binding.referencePaths.forEach((referencePath) => {
                  if (
                    isIdentifier(referencePath.node) &&
                    isExpression(resolvedImport)
                  ) {
                    replaceWithResolvedImport(
                      specifier,
                      referencePath.parentPath,
                      resolvedImport
                    )
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

export function replaceWithResolvedImport(
  specifier:
    | Babel.types.ImportSpecifier
    | Babel.types.ImportDefaultSpecifier
    | Babel.types.ImportNamespaceSpecifier,
  nodePath: Babel.NodePath<Babel.Node>,
  resolvedImport: Babel.types.Expression
) {
  switch (nodePath.node.type) {
    case 'MemberExpression':
      if (
        isIdentifier(nodePath.node.property) &&
        isObjectExpression(resolvedImport)
      ) {
        const propertyName = nodePath.node.property.name
        const memberExpressionProperty = resolvedImport.properties.find(
          (property) => {
            return (
              isObjectProperty(property) &&
              isIdentifier(property.key) &&
              property.key.name === propertyName
            )
          }
        )
        if (isObjectProperty(memberExpressionProperty)) {
          nodePath.replaceWith(memberExpressionProperty.value)
        }
      }
      break
    case 'ObjectProperty':
      if (specifier.type === 'ImportDefaultSpecifier') {
        if (isObjectExpression(resolvedImport)) {
          nodePath.replaceWithMultiple(resolvedImport.properties)
        } else {
          nodePath.replaceWith(resolvedImport)
        }
      } else if (isObjectProperty(nodePath.node)) {
        nodePath.node.value = resolvedImport
      }

      break

    case 'SpreadElement':
      if (
        typeof nodePath.key === 'number' &&
        isObjectExpression(nodePath.parentPath.node) &&
        isObjectExpression(resolvedImport)
      ) {
        nodePath.replaceWithMultiple(resolvedImport.properties)
      }
      break
  }
}

export function resolveImport(
  specifier:
    | ImportSpecifier
    | ImportDefaultSpecifier
    | ImportNamespaceSpecifier,
  moduleExports: Map<string, Babel.types.Expression>
) {
  switch (specifier.type) {
    case 'ImportNamespaceSpecifier':
      const namespaceExports = Array.from(moduleExports.entries())
      const objectProperties: Babel.types.ObjectProperty[] = namespaceExports.map(
        ([key, value]) => {
          return objectProperty(identifier(key), value)
        }
      )

      return objectExpression(objectProperties)
    case 'ImportDefaultSpecifier':
      return moduleExports.get('default')
    case 'ImportSpecifier':
      return moduleExports.get(specifier.local.name)
  }
}

export function resolveVariableDeclaratorReference(
  nodePath: Babel.NodePath<Babel.Node>,
  referencePath: Babel.NodePath<Babel.Node>
) {
  if (isVariableDeclarator(nodePath.node) && nodePath.node.init) {
    referencePath.replaceWith(nodePath.node.init)
  }
  nodePath.remove()
}

function resolveImportFilepath(source: string, path: string) {
  return require.resolve(source, {
    paths: [path],
  })
}

function parseAstFromFile(babel: typeof Babel, filepath: string) {
  const buffer = fs.readFileSync(filepath)
  const ast = babel.parseSync(buffer.toString(), {
    filename: filepath,
  })

  return ast
}

function resolveModuleExports(ast: Babel.Node | null) {
  const moduleExports: Map<string, Babel.types.Expression> = new Map()

  traverse(ast, {
    ExportDeclaration: {
      enter(exportDeclaration) {
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
