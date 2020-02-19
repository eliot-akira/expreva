import { Parser } from '../Parser'
import { Expression } from '../evaluate'

export default [
  // Array
  {
    match: /^\s*(\[)\s*/,
    name: 'open array',
    power: 80,
    prefix(parser: Parser) {
      const expr = parser.parseExpression(0)
      // Parse to right bracket
      parser.parseExpression(this.power)
      if (Array.isArray(expr) && expr[0]==='args..') {
        expr[0] = 'list'
        return expr
      }
      if (expr==null) return ['list']
      return ['list', expr]
    },
    infix(parser: Parser, left: Expression) {},
  },
  {
    match: /^\s*(\])\s*/,
    name: 'close array',
    power: 0,
    prefix() {},
    infix(parser: Parser, left: Expression[]) {},
  },
]