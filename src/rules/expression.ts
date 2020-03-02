import { Parser } from '../Parser'
import { Expression } from '../evaluate'

export default [
  {
    match: /^\s*(\()\s*/,
    name: 'open expression',
    power: 80,
    prefix(parser: Parser) {
      let level = ++parser.expressionLevel

      let expr = parser.parseExpression(0)
      if (parser.expressionLevel < level) {
        return expr
      }

      let current = parser.current()
      // Parse to right parenthesis or next statement
      let next
      const nexts = []
      const power = current.value!==')' ? 0 : this.power
      while((current = parser.current()) && (next = parser.parseExpression(current.value!==')' ? 0 : this.power))!=null ) {
        nexts.push(next)
      }

      parser.scheduleExpression(...nexts)
      expr = parser.withNextStatements(this.power, expr as Expression)

      // Disambiguate between x and (x)
      if (typeof expr==='string') return ['do', expr]

      return expr
    },
    infix(parser: Parser, left: Expression) {
      let level = ++parser.expressionLevel

      // Function call
      const isFunc = typeof left==='string' || Array.isArray(left)
      let expr = parser.parseExpression(0)
      if (parser.expressionLevel < level) {
        if (isFunc) {
          return [left, expr]
        }
        // Separate statements
        return ['do', left, expr]
      }

      let current = parser.current()
      // Parse to right parenthesis or next statement
      let next
      const nexts = []
      const power = current.value!==')' ? 0 : this.power
      while((next = parser.parseExpression(power))!=null) {
        nexts.push(next)
      }

      parser.scheduleExpression(...nexts)

      expr = parser.withNextStatements(this.power, expr as Expression)

      if (left==null) return expr
      return [left, expr]
    },
  },
  {
    match: /^\s*;*\s*(\))\s*/, // Include trailing end statement ;)
    name: 'close expression',
    power: 0,
    prefix(parser: Parser) { parser.expressionLevel--  },
    infix(parser: Parser) { parser.expressionLevel-- },
  },

  {
    match: /^\s*(;+)\s*/,
    name: 'end statement',
    power: 0,
    prefix(parser: Parser) {
      const right = parser.parseExpression(0)
      parser.scheduleExpression(right as Expression)
    },
    infix(parser: Parser, left: Expression[]) {
      parser.scheduleExpression(';')
      return left
    },
  },
]