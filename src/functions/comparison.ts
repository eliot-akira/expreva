
export function not(a) {
  return !a
}

export function equal(a, b) {
  return a === b
}

export function notEqual(a, b) {
  return a !== b
}

export function greaterThan(a, b) {
  return a > b
}

export function lessThan(a, b) {
  return a < b
}

export function greaterThanEqual(a, b) {
  return a >= b
}

export function lessThanEqual(a, b) {
  return a <= b
}

export function and(a, b) {
  return Boolean(a && b)
}

export function or(a, b) {
  return Boolean(a || b)
}

// export function inOperator(a, b) {
//   return contains(b, a)
// }

export function condition(cond, yep, nope) {
  return cond ? yep : nope
}
