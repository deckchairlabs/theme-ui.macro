import { NodePath, Node, Binding } from '@babel/traverse'
import { isVariableDeclarator, ObjectExpression } from '@babel/types'

export default function resolveBindings(nodePath: NodePath<ObjectExpression>) {
  const bindings = nodePath.scope.getAllBindings()

  Object.keys(bindings).forEach((key) => {
    const binding = nodePath.scope.getBinding(key)
    if (binding) {
      binding.referencePaths.forEach((reference) => {
        switch (binding.path.node.type) {
          case 'VariableDeclarator':
            resolveVariableDeclaratorBinding(binding, reference)
            break
        }
      })
    }
  })

  return nodePath
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

// export function resolveSpreadObjectExpressionBinding(
//   binding: Binding,
//   reference: NodePath<Node>
// ) {
//   if (
//     !isObjectExpression(reference.parentPath.parent) ||
//     !isSpreadElement(reference.parent)
//   ) {
//     return
//   }

//   const spreadElement = reference.parent
//   const propertyIndex = reference.parentPath.parent.properties.findIndex(
//     (property) => property === spreadElement
//   )

//   if (
//     isVariableDeclarator(binding.path.node) &&
//     isObjectExpression(binding.path.node.init)
//   ) {
//     reference.parentPath.parent.properties.splice(
//       propertyIndex,
//       0,
//       ...binding.path.node.init.properties
//     )
//   }

//   binding.path.remove()
//   reference.parentPath.remove()
// }
