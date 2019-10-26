
// TODO: Support BigInt, precision float

export function add(a, b) {
  if (Array.isArray(a)) {
    if (Array.isArray(b)) {
      a.push(...b)
    } else {
      a.push(b)
    }
    return a
  }
  if (typeof a==='object') {
    Object.assign(a, b)
    return a
  }
  return a + b //Number(a) + Number(b)
}

export function subtract(a, b) {
  return a - b
}

export function multiply(a, b) {
  return a * b
}

export function divide(a, b) {
  return a / b
}

export function modulo(a, b) {
  return a % b
}

export function negative(a) {
  return -a
}

export function factorial(a) { // a!, gamma(a + 1)
  let val=1
  for (let i = 2; i <= a; i++) {
    val = val * i
  }
  return val
}
