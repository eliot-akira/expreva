import util from 'util'
import * as expreva from '../index'

// Assertion helper
const eva = it => (k, v) => {
  let r
  try {
    r = expreva.evaluate(k)
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
const syntaxTreeToString = expreva.syntaxTreeToString.bind(expreva)

const inspect = obj => util.inspect(obj, false, null, true)

export { eva, parse, evaluate, syntaxTreeToString, inspect }