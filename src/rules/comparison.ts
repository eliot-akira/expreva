import { Parser } from '../Parser'
import { Expression } from '../evaluate'

export default [

  // Comparison
  {
    match: /^\s*(==)\s*/, // Must come before `=`
    name: '==',
    power: 40,
    prefix() {},
    infix(parser: Parser, left: Expression) {
      const right = parser.parseExpression(this.power)
      return ['==', left, right]
    },
  },
  {
    match: /^\s*(\!=)\s*/,
    name: '!=',
    power: 40,
    prefix() {},
    infix(parser: Parser, left: Expression) {
      const right = parser.parseExpression(this.power)
      return ['!=', left, right]
    },
  },

  {
    match: /^\s*(\!)\s*/,
    name: '!',
    power: 70,
    prefix(parser: Parser) {
      return ['!', parser.parseExpression(0)]
    },
    infix() {},
  },

  {
    match: /^\s*(<=)\s*/,
    name: '<=',
    power: 40,
    prefix() {},
    infix(parser: Parser, left: Expression) {
      const right = parser.parseExpression(this.power)
      return ['<=', left, right]
    },
  },
  {
    match: /^\s*(<)\s*/,
    name: '<',
    power: 40,
    prefix() {},
    infix(parser: Parser, left: Expression) {
      const right = parser.parseExpression(this.power)
      return ['<', left, right]
    },
  },
  {
    match: /^\s*(>=)\s*/,
    name: '>=',
    power: 40,
    prefix() {},
    infix(parser: Parser, left: Expression) {
      const right = parser.parseExpression(this.power)
      return ['>=', left, right]
    },
  },
  {
    match: /^\s*(>)\s*/,
    name: '>',
    power: 40,
    prefix() {},
    infix(parser: Parser, left: Expression) {
      const right = parser.parseExpression(this.power)
      return ['>', left, right]
    },
  },
]