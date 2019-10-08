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
