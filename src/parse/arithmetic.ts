import { Parser } from '../Parser'
import { Precedence } from './constants'

export default function(parser) {

  // Positive and negative  sign

  for (const operator of [ '+', '-' ]) {
    parser.prefix(operator, Precedence.PREFIX, (token, right) => ({
      value: token.match,
      toString() { return `(${operator}${right})` },
      left: { value: 0 },
      right
    }))
  }

  // Arithmetic

  for (const operator of [ '~', '!' ]) {
    parser.prefix(operator, Precedence.PREFIX, (token, right) => ({
      value: token.match,
      toString() { return `(${operator}${right})` },
      right
    }))
  }

  for (const operator of [ '+', '-' ]) {
    parser.infix(operator, Precedence.SUM, Parser.LEFT_ASSOC, (token, left, right) => ({
      value: token.match,
      toString() { return `(${left} ${operator} ${right})` },
      left,
      right
    }))
  }

  for (const operator of [ '*', '/' ]) {
    parser.infix(operator, Precedence.PRODUCT, Parser.LEFT_ASSOC, (token, left, right) => ({
      value: token.match,
      toString() { return `(${left} ${operator} ${right})` },
      left,
      right
    }))
  }

  parser

  .postfix('!', Precedence.POSTFIX, (token, left) => ({
    value: token.match,
    toString() { return `(${left}!)` }, left
  }))


  .infix('^', Precedence.EXPONENT, Parser.RIGHT_ASSOC, (token, left, right) => ({
    value: token.match,
    toString() { return `(${left}^${right})` }, left, right
  }))

  return parser
}