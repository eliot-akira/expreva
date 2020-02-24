import { Parser } from '../Parser'
import { Expression } from '../evaluate'

export default [
  {
    match: /^\s*(\(\s*\))\s*/,
    name: 'empty list',
    power: 80,
    prefix() {},
    infix(parser: Parser, left: Expression[]) {
      return left!=null ? [left] : ['list']
    },
  },
  {
    match: /^\s*(\()\s*/,
    name: 'open expression',
    power: 80,
    prefix(parser: Parser) {
      const expr = parser.parseExpression(0)

      // Parse to right parenthesis
      parser.parseExpression(this.power)

      // Disambiguate between x and (x)
      if (typeof expr==='string') return ['do', expr]

      return expr
    },
    infix(parser: Parser, left: Expression) {
      const right = parser.parseExpression(0)
      // Parse to right parenthesis
      parser.parseExpression(this.power)
      if (left==null) return right
      return [left, right]
    },
  },
  {
    match: /^\s*;*\s*(\))\s*/, // ), ;)
    name: 'close expression',
    power: 0,
    prefix() {},
    infix() {},
  },

  {
    match: /^\s*(;+)\s*/,
    name: 'end statement',
    power: 0,
    prefix(parser) {
      const right = parser.parseExpression(0)
      parser.scheduleExpression(right)
    },
    infix(parser: Parser, left: Expression[]) {
      parser.scheduleExpression(';')
      return left
    },
  },
]