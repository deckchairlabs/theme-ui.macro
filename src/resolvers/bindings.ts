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
} from '@babel/types'

export default function resolveBindings(
  nodePath: NodePath<ObjectExpression>,
  babel: typeof Babel,
  state: Babel.PluginPass
) {
  resolveImports(nodePath, babel, state)

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
  state: Babel.PluginPass
) {
  const filename = state.filename
  const ast = state.file.ast

  traverse(ast, {
    ImportDeclaration: {
      enter(path) {
        const source = path.node.source.value

        const importedAst = parseAstFromFile(source, dirname(filename), babel)
        const moduleExports = getExportedVariableDeclarations(importedAst)

        if (moduleExports.size > 0) {
          path.node.specifiers.forEach((specifier) => {
            switch (specifier.type) {
              case 'ImportSpecifier':
                const binding = nodePath.scope.getBinding(specifier.local.name)
                const resolvedImport = moduleExports.get(specifier.local.name)

                if (binding && resolvedImport) {
                  binding.referencePaths.forEach((referencePath) => {
                    if (
                      babel.types.isIdentifier(referencePath.node) &&
                      babel.types.isObjectProperty(
                        referencePath.parentPath.node
                      ) &&
                      babel.types.isIdentifier(
                        referencePath.parentPath.node.key
                      )
                    ) {
                      if (babel.types.isExpression(resolvedImport)) {
                        referencePath.parentPath.node.value = resolvedImport
                      }
                    }
                  })
                }
                break
            }
          })
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

function getExportedVariableDeclarations(
  ast: Babel.types.Program | Babel.types.File | null
) {
  const moduleExports: Map<string, Babel.Node> = new Map()

  // Extract all the export declarations from the AST
  traverse(ast, {
    ExportDeclaration: {
      enter(exportDeclaration) {
        if (isExportNamedDeclaration(exportDeclaration.node)) {
          if (isVariableDeclaration(exportDeclaration.node.declaration)) {
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
        }
      },
    },
  })

  return moduleExports
}
