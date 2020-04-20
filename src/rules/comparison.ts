import { Parser } from '../Parser'
import { Expression } from '../evaluate'
import { TokenType } from '../TokenType'

export default [

  // Comparison
  {
    match: /^(==)/, // Must come before `=`
    type: TokenType.binaryOperator,
    power: 40,
    prefix() {},
    infix(parser: Parser, left: Expression) {
      const right = parser.parseExpression(this.power)
      return ['==', left, right]
    },
  },
  {
    match: /^(\!=)/,
    type: TokenType.binaryOperator,
    power: 40,
    prefix() {},
    infix(parser: Parser, left: Expression) {
      const right = parser.parseExpression(this.power)
      return ['!=', left, right]
    },
  },

  {
    match: /^(\!)/,
    type: TokenType.unaryOperator,
    power: 70,
    prefix(parser: Parser) {
      return ['!', parser.parseExpression(0)]
    },
    infix() {},
  },

  {
    match: /^(<=)/,
    type: TokenType.binaryOperator,
    power: 40,
    prefix() {},
    infix(parser: Parser, left: Expression) {
      const right = parser.parseExpression(this.power)
      return ['<=', left, right]
    },
  },
  {
    match: /^(<)/,
    type: TokenType.binaryOperator,
    power: 40,
    prefix() {},
    infix(parser: Parser, left: Expression) {
      const right = parser.parseExpression(this.power)
      return ['<', left, right]
    },
  },
  {
    match: /^(>=)/,
    type: TokenType.binaryOperator,
    power: 40,
    prefix() {},
    infix(parser: Parser, left: Expression) {
      const right = parser.parseExpression(this.power)
      return ['>=', left, right]
    },
  },
  {
    match: /^(>)/,
    type: TokenType.binaryOperator,
    power: 40,
    prefix() {},
    infix(parser: Parser, left: Expression) {
      const right = parser.parseExpression(this.power)
      return ['>', left, right]
    },
  },
]