/*!
Expreva started as a fork of:
[Mathematical Expression Evaluator](https://github.com/silentmatt/expr-eval)
Ported and modified from [ndef.parser](http://www.undefined.ch/mparser/index.html) by Raphael Graf(r@undefined.ch)
*/

import parse from './parse'
import evaluate from './evaluate'
//import compile from './compile'
import { Instruction } from './instruction'
import { Token } from './token'
import { Source, Scope, Options, Instructions } from './types'

class Expreva {

  scope: Scope
  options: Options
  instructions: Instructions

  constructor(scope: Scope = {}, options: Options = {}) {
    this.scope = scope
    this.options = options
    this.instructions = []
  }

  parse(source: Source | Instructions): Instructions {

    // Already parsed
    if (Array.isArray(source)) {
      return this.instructions = source
    }

    try {
      this.instructions = parse(source)
    } catch(e) {
      // Partially tokenized instructions for reference
      this.instructions = e.instructions
      throw e
    }

    return this.instructions
  }

  evaluate(source: Source | Instructions, scope: Scope): any {
    return evaluate(
      typeof source==='string' ? this.parse(source) : source,
      scope || this.scope
    )
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

const expreva = new Expreva() as Expreva & {
  create: (scope: Scope, options: Options) => Expreva
  Instruction: Instruction
  Token: Token
}

Object.assign(expreva, {
  create(scope: Scope = {}, options: Options = {}) {
    return new Expreva(scope, options)
  },
  Instruction,
  Token
})

export default expreva
