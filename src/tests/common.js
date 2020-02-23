const expreva = require('../../build').default

// Assertion helper
const eva = it => (k, v) => {
  let r
  try {
    r = evaluate(k)
  } catch(e) {
    r = e.message
  }
  const pass = v instanceof Function ? v(r) : it.is(r, v)
  it(k, pass)
  if (!pass && !(v instanceof Function)) {
    console.log('expected', v)
    console.log('actual', r)
  }
}

const parse = expreva.parse.bind(expreva)
const evaluate = expreva.evaluate.bind(expreva)
const toString = expreva.toString.bind(expreva)

module.exports = { eva, parse, evaluate, toString }