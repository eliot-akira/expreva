import { Parser } from '../Parser'
import { Expression } from '../evaluate'
import { TokenType } from '../TokenType'

export default [

  // Conditional

  // Reserved words must come before symbol
  {
    match: /^(if)/,
    type: TokenType.unaryOperator,
    power: 20,
    prefix(parser: Parser) {
      const condition = parser.parseExpression(this.power)

      let trueBranch = parser.parseExpression(this.power)
      if (trueBranch==='then') trueBranch = parser.parseExpression(this.power)
      let falseBranch = parser.parseExpression(this.power)
      if (falseBranch==='else') falseBranch = parser.parseExpression(this.power)

      return ['if', condition, trueBranch, falseBranch]
    },
    infix(parser: Parser, left: Expression) {
      return left
    },
  },
  {
    match: /^(or)/,
    type: TokenType.binaryOperator,
    power: 30,
    prefix() {},
    infix(parser: Parser, left: Expression) {
      const right = parser.parseExpression(this.power)
      return ['||', left, right]
    },
  },
  {
    match: /^(and)/,
    type: TokenType.binaryOperator,
    power: 30,
    prefix() {},
    infix(parser: Parser, left: Expression) {
      const right = parser.parseExpression(this.power)
      return ['&&', left, right]
    },
  },
  {
    match: /^(not)/,
    type: TokenType.unaryOperator,
    power: 70,
    prefix(parser: Parser) {
      return ['!', parser.parseExpression(0)]
    },
    infix() {},
  },

  {
    match: /^(\?)/,
    type: TokenType.binaryOperator, // Tertiary
    power: 20,
    prefix() {},
    infix(parser: Parser, left: Expression) {
      const trueBranch = parser.parseExpression(this.power)
      let falseBranch = parser.parseExpression(this.power)
      if (falseBranch===':') falseBranch = parser.parseExpression(this.power)
      return ['if', left, trueBranch, falseBranch]
    },
  },

  {
    match: /^(\|\|)/,
    type: TokenType.binaryOperator,
    power: 30,
    prefix() {},
    infix(parser: Parser, left: Expression) {
      const right = parser.parseExpression(this.power)
      return ['||', left, right]
    },
  },

  {
    match: /^(&&)/,
    type: TokenType.binaryOperator,
    power: 30,
    prefix() {},
    infix(parser: Parser, left: Expression) {
      const right = parser.parseExpression(this.power)
      return ['&&', left, right]
    },
  },

]