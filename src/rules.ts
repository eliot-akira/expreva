import { Parser } from './Parser'
import { Expression } from './evaluate'

/**
 * Defines a grammar of rules for the language. It supports:
 *
 * - Number
 * - Number prefix `+` and `-`
 * - Symbol for variables
 * - String wrapped in double- or single-quotes, and escape characters
 * - Arithmetic operations: add, subtract, multply, divide
 * - Assignment with `=`
 * - Group expression with `(` and `)`
 * - Statement separator `;`
 * - Anonymous function with arguments: `x =>` and `(x, y) =>`
 * - Function application with `arg->f`
 *
 * The order of rules below determines the order of regular expression match.
 */

export default [
  {
    match: /^\s*((\d+)?\.?\d+)\s*/,
    name: 'number',
    power: 0,
    prefix(parser: Parser) {
      return parseFloat(this.value)
    }
  },
  {
    match: /^\s*([a-zA-Z0-9_]+)\s*/,
    name: 'symbol',
    power: 0,
    prefix(parser: Parser) {
      return this.value
        .trim() // This shouldn't be necessary, but still encountered trailing white space
    },
  },
  {
    /**
     * Match quoted strings with escaped characters
     *
     * @see https://stackoverflow.com/questions/249791/regex-for-quoted-string-with-escaping-quotes#answer-10786066
     */
    match: /^\s*"([^"\\]*(\\.[^"\\]*)*)"|\'([^\'\\]*(\\.[^\'\\]*)*)\'/,
    name: 'string',
    power: 0,
    prefix(parser: Parser) {
      // Quick unescape
      return ['`', JSON.parse(`"${this.value}"`)]
    },
  },
  {
    match: /^\s*;*\s*(\))\s*/, // ;)
    name: 'close expression',
    power: 0,
    prefix(parser: Parser) {},
    infix(parser: Parser, left: Expression[]) {},
  },
  {
    match: /^\s*(;+)\s*/,
    name: 'end statement',
    power: 0,
    prefix(parser: Parser) {},
    infix(parser: Parser, left: Expression) {
      const right = parser.nextExpression(0)
      if (!right) return left
      return [left, ';', right]
    },
  },
  {
    match: /^\s*(=>)\s*/,
    name: 'lambda',
    power: 70,
    prefix(parser: Parser) {},
    infix(parser: Parser, left: Expression) {

      if (!parser.isArgumentList(left)) {
        left = ['args..', left]
      }

      const right = parser.nextExpression(0)
      return ['lambda', left, right]
    },
  },
  {
    match: /^\s*(->)\s*/, // Must come before `-` or `>`
    name: '->',
    prefix(parser: Parser) {},
    power: 60, // Weaker than `=>`
    infix(parser: Parser, left: Expression) {
      const right = parser.nextExpression(0)
      if (left==null) return right
      return [right, left]
    },
  },

  {
    match: /^\s*(==)\s*/, // Must come before `=`
    name: '==',
    power: 30,
    prefix(parser: Parser) {},
    infix(parser: Parser, left: Expression) {
      const right = parser.nextExpression(this.power)
      return ['==', left, right]
    },
  },
  {
    match: /^\s*(\!=)\s*/,
    name: '!=',
    power: 30,
    prefix(parser: Parser) {},
    infix(parser: Parser, left: Expression) {
      const right = parser.nextExpression(this.power)
      return ['!=', left, right]
    },
  },
  {
    match: /^\s*(<=)\s*/,
    name: '<=',
    power: 30,
    prefix(parser: Parser) {},
    infix(parser: Parser, left: Expression) {
      const right = parser.nextExpression(this.power)
      return ['<=', left, right]
    },
  },
  {
    match: /^\s*(<)\s*/,
    name: '<',
    power: 30,
    prefix(parser: Parser) {},
    infix(parser: Parser, left: Expression) {
      const right = parser.nextExpression(this.power)
      return ['<', left, right]
    },
  },
  {
    match: /^\s*(>=)\s*/,
    name: '>=',
    power: 30,
    prefix(parser: Parser) {},
    infix(parser: Parser, left: Expression) {
      const right = parser.nextExpression(this.power)
      return ['>=', left, right]
    },
  },
  {
    match: /^\s*(>)\s*/,
    name: '>',
    power: 30,
    prefix(parser: Parser) {},
    infix(parser: Parser, left: Expression) {
      const right = parser.nextExpression(this.power)
      return ['>', left, right]
    },
  },

  {
    match: /^\s*(=)\s*/,
    name: 'set',
    power: 20,
    prefix() {},
    infix(parser: Parser, left: Expression) {
      const right = parser.nextExpression(this.power)
      return ['set', left, right]
    },
  },

  {
    match: /^\s*([+])\s*/,
    name: '+',
    power: 50,
    prefix(parser: Parser) {
      /**
       * Positive sign binds stronger than / or *
       */
      return parser.nextExpression(70)
    },
    infix(parser: Parser, left: Expression) {
      const right = parser.nextExpression(this.power)
      return ['+', left, right]
    },
  },
  {
    match: /^\s*(-)\s*/,
    name: '-',
    power: 50,
    prefix(parser: Parser) {
      /**
       * Negative sign binds stronger than / or *
       */
      return -parser.nextExpression(70)
    },
    infix(parser: Parser, left: Expression) {
      const right = parser.nextExpression(this.power)
      return ['-', left, right]
    },
  },
  {
    match: /^\s*(\*)\s*/,
    name: '*',
    power: 60,
    infix(parser: Parser, left: Expression) {
      const right = parser.nextExpression(this.power)
      return ['*', left, right]
    },
  },
  {
    match: /^\s*(\/)\s*/,
    name: '/',
    power: 60,
    infix(parser: Parser, left: Expression) {
      const right = parser.nextExpression(this.power)
      return ['/', left, right]
    },
  },
  {
    match: /^\s*(\()\s*/,
    name: 'open expression',
    power: 80,
    prefix(parser: Parser) {
      const expr = parser.nextExpression(0)
      // Parse to right parenthesis
      parser.nextExpression(this.power)
      return expr
    },
    infix(parser: Parser, left: Expression) {
      const right = parser.nextExpression(0)
      // Parse to right parenthesis
      parser.nextExpression(this.power)
      if (left==null) return right
      return [left, right]
    },
  },
  {
    match: /^\s*(\,)\s*/,
    name: 'argument separator',
    power: 5, // Stronger than )
    prefix(parser: Parser) {},
    infix(parser: Parser, left: Expression) {
      /**
       * Add right side to argument list
       */
      const right = parser.nextExpression(70) // Stronger than `->`
      let args: Expression = ['args..']

      if (parser.isArgumentList(left)) {
        args = left
      } else if (left!=null) {
        args.push(left)
      }
      if (right!=null) args.push(right)
      return args
    }
  },
]
