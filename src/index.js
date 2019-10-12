/*!
Expreva started as a fork of:
[Mathematical Expression Evaluator](https://github.com/silentmatt/expr-eval)
Based on [ndef.parser](http://www.undefined.ch/mparser/index.html) by Raphael Graf(r@undefined.ch)
Ported to JavaScript and modified by Matthew Crumley (email@matthewcrumley.com, http://silentmatt.com/)
*/

import parse from './parse'
import evaluate from './evaluate'
//import compile from './compile'

class Expreva {

  constructor(globalScope = {}, options = {}) {
    this.scope = globalScope
    this.options = options
    this.instructions = []
  }

  parse(source) {

    if (typeof source !== 'string') {
      // Already parsed
      if (Array.isArray(source)) this.instructions = source
      return this
    }

    try {
      this.instructions = parse(source)
    } catch(e) {
      // Partially tokenized instructions for reference
      this.instructions = e.instructions
      throw e
    }

    return this
  }

  evaluate(source, scope) {
    this.parse(source)
    return evaluate(this.instructions, this.scope, scope)
  }

  /*
  toString() {
    return compile(this.instrs, false)
  }
  compile(param, scope) {
    const expr = this
    const f = new Function(param, // eslint-disable-line no-new-func
      'with(this.functions) with (this.ternaryOps) with (this.binaryOps) with (this.unaryOps) { return '
      + compile(
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
