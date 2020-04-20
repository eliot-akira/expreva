import { Parser } from '../Parser'
import { Expression } from '../evaluate'
import { TokenType } from '../TokenType'

export default [
  {
    match: /^(;+)/,
    type: TokenType.endStatement,
    power: 0,
    prefix(parser: Parser) {
      const right = parser.parseExpression(0)
      parser.scheduleExpression(right as Expression)
    },
    infix(parser: Parser, left: Expression[]) {
      parser.scheduleExpression(';')
      return left
    },
  }
]
