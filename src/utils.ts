export function notUndefined<TValue>(
  value: TValue | null | undefined
): value is TValue {
  return value !== undefined
}
