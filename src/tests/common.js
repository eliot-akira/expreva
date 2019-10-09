const expreva = require('../../build/expreva')

// Assertion helper
const eva = it => (k, v) => it(k, it.is(evaluate(k), v))

const parse = expreva.parse.bind(expreva)
const evaluate = expreva.evaluate.bind(expreva)

module.exports = { eva, parse, evaluate }