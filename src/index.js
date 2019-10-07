/*!
Expreva is originally based on:

[Mathematical Expression Evaluator](https://github.com/silentmatt/expr-eval)
Based on [ndef.parser](http://www.undefined.ch/mparser/index.html) by Raphael Graf(r@undefined.ch)
Ported to JavaScript and modified by Matthew Crumley (email@matthewcrumley.com, http://silentmatt.com/)
*/
import { Expression } from './expression'
import { Parser } from './parser'

const { parse, evaluate } = Parser

function expreva(expr, scope = {}) {
  return Parser.evaluate(expr, scope, expreva.scope)
}

expreva.scope = {}
expreva.parse = function(expr, scope) {
  return Parser.parse(expr, scope, expreva.scope)
}
expreva.evaluate = expreva

export default expreva
