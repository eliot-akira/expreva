/*!
Expreva started as a fork of:
[Mathematical Expression Evaluator](https://github.com/silentmatt/expr-eval)
Based on [ndef.parser](http://www.undefined.ch/mparser/index.html) by Raphael Graf(r@undefined.ch)
Ported to JavaScript and modified by Matthew Crumley (email@matthewcrumley.com, http://silentmatt.com/)
*/

import tokenize from './tokenize'
import lex from './lex'
import evaluate from './evaluate'
import * as builtIns from './functions/builtIns'
//import expressionToString from './expression-to-string'

class Expreva {

  constructor(scope = {}, options = {}) {
    this.scope = scope
    this.options = options
    this.instructions = []
    Object.assign(this, builtIns)
  }

  parse(source) {

    if (typeof source !== 'string') {
      // Already parsed
      if (Array.isArray(source)) this.instructions = source
      return this
    }
    const lexer = lex(this, tokenize(this, source))

    try {
      this.instructions = lexer.parse()
    } catch(e) {
      // Store incomplete instructions for reference
      this.instructions = lexer.instructions
      throw e
    }

    return this
  }

  evaluate(source, scope, globalScope) {
    this.scope = globalScope || this.scope
    this.parse(source)
    return evaluate(this.instructions, this, scope)
  }

  /*
  toString() {
    return expressionToString(this.instrs, false)
  }
  compile(param, scope) {
    const expr = this
    const f = new Function(param, // eslint-disable-line no-new-func
      'with(this.functions) with (this.ternaryOps) with (this.binaryOps) with (this.unaryOps) { return '
      + expressionToString(
        this.instrs, //this.simplify(scope).instrs,
        true
      )
      + '; }'
    )
    return function () {
      return f.apply(expr, arguments)
    }
  }
*/
}

const expreva = new Expreva

expreva.create = function(scope, options) {
  return new Expreva(scope, options)
}

export default expreva
