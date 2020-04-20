import { Parser } from '../Parser'
import { Expression } from '../evaluate'
import { TokenType } from '../TokenType'

export default [

  // Comma operator for function arguments, array items, object key-value pairs

  {
    match: /^(\,)/,
    type: TokenType.commaSeparator,
    power: 0, // Was 5, Stronger than )
    prefix(parser: Parser) {
console.log(', pre')
const right = parser.parseExpression(this.power)
return right // [left, right]
      // return ','
    },
    infix(parser: Parser, left: Expression) {
console.log(', in')
      const right = parser.parseExpression(this.power)
return right // [left, right]
      // if (Array.isArray(left) && left[0]==='args..') {
      //   left.push(right)
      //   return left
      // }
      // const result = ['args..', left, right]
      // return result
    }
  }
]