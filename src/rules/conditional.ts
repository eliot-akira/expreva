import { Parser } from '../Parser'
import { Expression } from '../evaluate'

export default [
  // Conditional

  // Reserved words must come before symbol
  {
    match: /^\s*(if)\s*/,
    name: 'if',
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
    match: /^\s*(or)\s*/,
    name: 'or',
    power: 30,
    prefix() {},
    infix(parser: Parser, left: Expression) {
      const right = parser.parseExpression(this.power)
      return ['||', left, right]
    },
  },
  {
    match: /^\s*(and)\s*/,
    name: 'and',
    power: 30,
    prefix() {},
    infix(parser: Parser, left: Expression) {
      const right = parser.parseExpression(this.power)
      return ['&&', left, right]
    },
  },
  {
    match: /^\s*(not)\s*/,
    name: 'not',
    power: 70,
    prefix(parser: Parser) {
      return ['!', parser.parseExpression(0)]
    },
    infix() {},
  },

  {
    match: /^\s*(\?)\s*/,
    name: '?',
    power: 20,
    prefix() {},
    infix(parser: Parser, left: Expression) {
      const trueBranch = parser.parseExpression(this.power)
      const falseBranch = parser.parseExpression(this.power)
      return ['if', left, trueBranch, falseBranch]
    },
  },
  {
    match: /^\s*(:)\s*/,
    name: ':',
    power: 20,
    prefix(parser: Parser) {
      return parser.parseExpression(0)
    },
    infix(parser: Parser, left: Expression) {
      const right = parser.parseExpression(this.power)

      // Key-value pair for object definition
      if (!Array.isArray(left) || left[0]!=='if') {
        return ['pair', left, right]
      }

      if (right) left.push(right)
      return left
    },
  },

  {
    match: /^\s*(\|\|)\s*/,
    name: '||',
    power: 30,
    prefix() {},
    infix(parser: Parser, left: Expression) {
      const right = parser.parseExpression(this.power)
      return ['||', left, right]
    },
  },

  {
    match: /^\s*(&&)\s*/,
    name: '&&',
    power: 30,
    prefix() {},
    infix(parser: Parser, left: Expression) {
      const right = parser.parseExpression(this.power)
      return ['&&', left, right]
    },
  },

]