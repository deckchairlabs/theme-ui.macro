import * as Babel from '@babel/core'

export function notUndefined<TValue>(
  value: TValue | null | undefined
): value is TValue {
  return value !== undefined
}

export function getObjectPropertyKey(property: Babel.types.ObjectProperty) {
  return Babel.types.isStringLiteral(property.key)
    ? property.key.value
    : Babel.types.isIdentifier(property.key)
    ? property.key.name
    : false
}

export function getObjectPropertyValue(property: Babel.types.ObjectProperty) {
  return Babel.types.isStringLiteral(property.value) && property.value.value
}

export function expressionToCssValue(
  expression: Babel.types.Expression | Babel.types.SpreadElement | null
) {
  if (!expression) {
    return expression
  }

  switch (expression.type) {
    case 'NumericLiteral':
      if (expression.value < 1 && !Number.isInteger(expression.value)) {
        return String(100 * expression.value) + '%'
      }
      return String(expression.value) + 'px'
    case 'StringLiteral':
      return expression.value
    default:
      return null
  }
}

export function camelCaseToKebabCase(string: string) {
  return string
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z])(?=[a-z])/g, '$1-$2')
    .toLowerCase()
}
