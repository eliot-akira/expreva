import { Parser } from '../Parser'
import { Expression } from '../evaluate'

export default [

  // Comma operator for function arguments, array items, object key-value pairs

  {
    match: /^\s*(\,)\s*/,
    name: 'argument separator',
    power: 5, // Was 5, Stronger than )
    prefix(parser: Parser) {
      return ','
    },
    infix(parser: Parser, left: Expression) {
      const right = parser.parseExpression(this.power)
      if (Array.isArray(left) && left[0]==='args..') {
        left.push(right)
        return left
      }
      const result = ['args..', left, right]
      return result
    }
  }
]