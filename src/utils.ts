import {
  isStringLiteral,
  isIdentifier,
  Expression,
  SpreadElement,
  ObjectProperty,
  isNumericLiteral,
} from '@babel/types'

export function notUndefined<TValue>(
  value: TValue | null | undefined
): value is TValue {
  return value !== undefined
}

export function toCustomPropertyValue(
  property: string | number,
  scale?: string
) {
  const path = getPropertyPath(property, scale)
  return `var(--${path.replace(/\./g, '-')})`
}

export function getPropertyPath(property: string | number, scale?: string) {
  return [scale, property].filter(Boolean).join('.')
}

export function getObjectPropertyKey(property: ObjectProperty) {
  return isStringLiteral(property.key)
    ? property.key.value
    : isIdentifier(property.key)
    ? property.key.name
    : false
}

export function getObjectPropertyValue(property: ObjectProperty) {
  return (
    (isStringLiteral(property.value) || isNumericLiteral(property.value)) &&
    property.value.value
  )
}

export function primitiveToCssValue(primitive: string | number) {
  switch (typeof primitive) {
    case 'number':
      if (primitive < 1 && !Number.isInteger(primitive)) {
        return String(100 * primitive) + '%'
      }
      return String(primitive) + 'px'
    default:
      return primitive
  }
}

export function expressionToCssValue(
  expression: Expression | SpreadElement | null
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
