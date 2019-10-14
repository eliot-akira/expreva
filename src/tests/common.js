const expreva = require('../../build/expreva')

// Assertion helper
const eva = it => (k, v) => {
  let r
  try {
    r = evaluate(k)
  } catch(e) {
    r = e.message
  }
  it(k, it.is(r, v))
}

const parse = expreva.parse.bind(expreva)
const evaluate = expreva.evaluate.bind(expreva)

const { Instruction, Token } = expreva

module.exports = { eva, parse, evaluate, Instruction, Token }