import { Parser } from '../Parser'
import { Expression } from '../evaluate'

export default [
  {
    match: /^\s*(\(\s*\))\s*/,
    name: 'empty list',
    power: 80,
    prefix(parser) {},
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
      // Include expressions pushed by end statement
      return parser.handleNextExpressions(expr as Expression)
    },
    infix(parser: Parser, left: Expression) {
      let right = parser.parseExpression(0)
      // Parse to right parenthesis
      parser.parseExpression(this.power)
      // Include expressions pushed by end statement
      right = parser.handleNextExpressions(right)
      if (left==null) return right
      return [left, right]
    },
  },
  {
    match: /^\s*;*\s*(\))\s*/, // ), ;)
    name: 'close expression',
    power: 0,
    prefix() {},
    infix(parser: Parser, left: Expression[]) {},
  },

  {
    match: /^\s*(;+)\s*/,
    name: 'end statement',
    power: 0,
    prefix(parser: Parser) {
      const left = parser.parseExpression(0)
      if (left!=null) parser.pushNextExpression(left)
    },
    infix() {},
  },
]