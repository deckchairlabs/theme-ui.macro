import { VisitNodeObject } from '@babel/traverse'
import {
  ObjectProperty,
  isIdentifier,
  isVariableDeclarator,
  isObjectExpression,
  objectProperty,
  identifier,
  objectExpression,
} from '@babel/types'

export const ObjectPropertyVisitor: VisitNodeObject<{}, ObjectProperty> = {
  enter(path) {
    if (isIdentifier(path.node.value)) {
      const binding = path.scope.getBinding(path.node.value.name)
      if (binding && isVariableDeclarator(binding.path)) {
        if (
          isVariableDeclarator(binding.path.node) &&
          isObjectExpression(binding.path.node.init)
        ) {
          path.replaceWith(
            objectProperty(
              identifier(path.node.value.name),
              objectExpression(binding.path.node.init.properties)
            )
          )
          binding.path.remove()
        }
      }
    }
  },
}
