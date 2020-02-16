const expreva = require('../../build/expreva')

// Assertion helper
const eva = it => (k, v) => {
  let r
  try {
    r = evaluate(k)
  } catch(e) {
    r = e.message
  }
  it(k, v instanceof Function ? v(r) : it.is(r, v))
}

const parse = expreva.parse.bind(expreva)
const evaluate = expreva.evaluate.bind(expreva)
const toString = expreva.toString.bind(expreva)

module.exports = { eva, parse, evaluate, toString }