import { Parser } from '../Parser'
import { Precedence } from './constants'

export default function(parser) {

  parser

  // Arithmetic

  .prefix('+', Precedence.PREFIX, (token, right) => ({
    value: token.match,
    toString() { return `(+${right})` },
    left: { value: 0 },
    right
  }))

  .prefix('-', Precedence.PREFIX, (token, right) => ({
    value: token.match,
    toString() { return `(-${right})` },
    left: { value: 0 },
    right
  }))

  .prefix('~', Precedence.PREFIX, (token, right) => ({
    value: token.match,
    toString() { return `(~${right})` }, right
  }))

  .prefix('!', Precedence.PREFIX, (token, right) => ({
    value: token.match,
    toString() { return `(!${right})` }, right
  }))

  .postfix('!', Precedence.POSTFIX, (token, left) => ({
    value: token.match,
    toString() { return `(${left}!)` }, left
  }))

  .infix('+', Precedence.SUM, Parser.LEFT_ASSOC, (token, left, right) => ({
    value: token.match,
    toString() { return `(${left}+${right})` }, left, right
  }))

  .infix('-', Precedence.SUM, Parser.LEFT_ASSOC, (token, left, right) => ({
    value: token.match,
    toString() { return `(${left}-${right})` },
    left,
    right
  }))

  .infix('*', Precedence.PRODUCT, Parser.LEFT_ASSOC, (token, left, right) => ({
    value: token.match,
    toString() { return `(${left}*${right})` }, left, right
  }))

  .infix('/', Precedence.PRODUCT, Parser.LEFT_ASSOC, (token, left, right) => ({
    value: token.match,
    toString() { return `(${left}/${right})` }, left, right
  }))

  .infix('^', Precedence.EXPONENT, Parser.RIGHT_ASSOC, (token, left, right) => ({
    value: token.match,
    toString() { return `(${left}^${right})` }, left, right
  }))

  return parser
}