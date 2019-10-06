import { TEOF } from './token'
import { TokenStream } from './token-stream'
import { ParserState } from './parser-state'
import { Expression } from './expression'
import * as predefinedFunctions from './functions/predefined'

class Parser {
  constructor(options) {
    this.options = options || {}
    this.scope = {}
    Object.assign(this, predefinedFunctions)
  }
  parse(expr, scope, globalScope) {
    if (typeof expr !== 'string' || expr === '') return expr
    this.scope = globalScope || this.scope
    const instr = []
    const parserState = new ParserState(this, new TokenStream(this, expr))
    try {
      parserState.parseExpression(instr)
      //parserState.expect(TEOF, 'EOF')
    }
    catch (e) {
      throw e
    }
    return new Expression(instr, this)
  }
  evaluate(expr, scope, globalScope) {
    const parsed = this.parse(expr)
    if (!(parsed instanceof Expression))
      return parsed
    this.scope = globalScope || this.scope
    return parsed.evaluate(scope)
  }
}

const sharedParser = new Parser()

Parser.parse = function(expr, scope, globalScope) {
  return sharedParser.parse(expr, scope, globalScope)
}

Parser.evaluate = function(expr, scope, globalScope) {
  this.scope = globalScope || this.scope
  return sharedParser.parse(expr).evaluate(scope)
}

export { Parser }