import { VisitNodeFunction } from '@babel/traverse'
import {
  isObjectExpression,
  isStringLiteral,
  ObjectProperty,
} from '@babel/types'
import { get, Theme } from '@theme-ui/css'
import {
  getObjectPropertyKey,
  objectToObjectPropertyExpressions,
  shouldSkipProperty,
} from '../utils'

export default function applyDirectiveVisitor(theme: Theme) {
  const visitor: VisitNodeFunction<{}, ObjectProperty> = (path) => {
    const property = path.node
    const propertyKey = getObjectPropertyKey(property)

    if (propertyKey && !shouldSkipProperty(propertyKey)) {
      if (
        propertyKey === '@apply' &&
        isStringLiteral(property.value) &&
        isObjectExpression(path.parentPath.node)
      ) {
        const applyValue:
          | Record<string, string | number | string[] | number[]>
          | undefined = get(theme, property.value.value)

        if (applyValue && typeof path.key === 'number') {
          const properties = objectToObjectPropertyExpressions(applyValue)

          // Add the properties from @apply at the index of the current @apply property
          path.parentPath.node.properties.splice(path.key, 0, ...properties)

          // Remove the current @apply property
          path.remove()
        }
      }
    }
  }
  return visitor
}
