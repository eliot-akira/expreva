import { Parser } from '../Parser'
import { Expression } from '../evaluate'

export default [
  // Key-value pair ":" (key: value) and conditional ":" (cond ? true : false)
  {
    match: /^\s*(:)\s*/,
    name: ':',
    power: 0,
    prefix(parser: Parser) {
      return ':'
    },
    infix(parser: Parser, left: Expression) {
      if (left==null) return
      const right = parser.parseExpression(this.power)
      if (right) {
        if (!Array.isArray(left)) {
          left = [left]
        }
        left.push(right)
      }
      return left
    },
  },
]