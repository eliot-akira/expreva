//import simplify from './simplify'
//import substitute from './substitute'
//import getSymbols from './get-symbols'
import evaluate from './evaluate'
import expressionToString from './expression-to-string'

export class Expression {

  constructor(tokens, parser) {
    this.tokens = tokens
    this.parser = parser
    this.unaryOps = parser.unaryOps
    this.binaryOps = parser.binaryOps
    this.ternaryOps = parser.ternaryOps
    this.functions = parser.functions
    this.scope = parser.scope
  }

  evaluate(scope = {}) {
    return evaluate(this.tokens, this, scope)
  }

  toString() {
    return expressionToString(this.tokens, false)
  }
  /*
  simplify(scope = {}) {
    return new Expression(simplify(this.tokens, this.unaryOps, this.binaryOps, this.ternaryOps, scope), this.parser)
  }

  substitute(variable, expr) {
    if (!(expr instanceof Expression)) {
      expr = this.parser.parse(String(expr))
    }

    return new Expression(substitute(this.tokens, variable, expr), this.parser)
  }

  symbols(options = {}) {
    const vars = []
    getSymbols(this.tokens, vars, options)
    return vars
  }

  variables(options = {}) {
    const vars = []
    getSymbols(this.tokens, vars, options)
    const functions = this.functions
    return vars.filter(function (name) {
      return !(name in functions)
    })
  }
*/

  compile(param, scope) {
    const expr = this
    const f = new Function(param, // eslint-disable-line no-new-func
      'with(this.functions) with (this.ternaryOps) with (this.binaryOps) with (this.unaryOps) { return '
      + expressionToString(
        this.tokens, //this.simplify(scope).tokens,
        true
      )
      + '; }'
    )
    return function () {
      return f.apply(expr, arguments)
    }
  }
}
