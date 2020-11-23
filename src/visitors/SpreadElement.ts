import { VisitNodeObject } from '@babel/traverse'
import {
  SpreadElement,
  stringLiteral,
  isIdentifier,
  isVariableDeclarator,
  isObjectExpression,
  isImportDefaultSpecifier,
} from '@babel/types'

export const SpreadElementVisitor: VisitNodeObject<{}, SpreadElement> = {
  enter(path) {
    if (isIdentifier(path.node.argument)) {
      const binding = path.scope.getBinding(path.node.argument.name)
      if (binding && isVariableDeclarator(binding.path)) {
        if (
          isVariableDeclarator(binding.path.node) &&
          isObjectExpression(binding.path.node.init)
        ) {
          path.replaceWithMultiple(binding.path.node.init.properties)
          binding.path.remove()
        }
      } else if (binding && isImportDefaultSpecifier(binding.path)) {
        path.replaceWith(stringLiteral('test'))
      }
    }
  },
}
