import { Parser } from '../Parser'
import { Expression } from '../evaluate'
import { TokenType } from '../TokenType'

export default [

  {
    match: /^(=)/,
    type: TokenType.assignment,
    power: 10,
    prefix() {},
    infix(parser: Parser, left: Expression) {
      const right = parser.parseExpression(this.power)
      return ['def', left, right]
    },
  },

  {
    match: /^(\+)/,
    type: TokenType.binaryOperator,
    power: 50,
    prefix(parser: Parser) {
      return parser.parseExpression(70) // Positive sign binds stronger than / or *
    },
    infix(parser: Parser, left: Expression) {
      const right = parser.parseExpression(this.power)
      return ['+', left, right]
    },
  },
  {
    match: /^(-)/,
    type: TokenType.binaryOperator,
    power: 50,
    prefix(parser: Parser) {
      return -parser.parseExpression(70) // Negative sign binds stronger than / or *
    },
    infix(parser: Parser, left: Expression) {
      const right = parser.parseExpression(this.power)
      return ['-', left, right]
    },
  },
  {
    match: /^(\*)/,
    type: TokenType.binaryOperator,
    power: 60,
    infix(parser: Parser, left: Expression) {
      const right = parser.parseExpression(this.power)
      return ['*', left, right]
    },
  },
  {
    match: /^(\/)/,
    type: TokenType.binaryOperator,
    power: 60,
    infix(parser: Parser, left: Expression) {
      const right = parser.parseExpression(this.power)
      return ['/', left, right]
    },
  },
]