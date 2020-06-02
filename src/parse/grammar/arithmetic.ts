import { precedence } from './constants'

export default function(parser) {

  // Positive and negative sign

  for (const operator of [ '+', '-' ]) {
    parser.prefix(operator, precedence.PREFIX, (token, right) => {
      // Number
      if (right.value!=null && typeof right.value==='number') {
        return {
          value: token.match==='-' ? (0 - right.value) : (0 + right.value),
          toString() { return `${operator}${right.value}` },
        }
      }
      // Expression
      return {
        value: token.match,
        left: { value: 0 },
        right,
        toString() { return `(${operator}${right})` },
      }
    })
  }

  // Arithmetic

  for (const operator of [ '!' ]) { // Previously [ '~', '!' ]
    parser.prefix(operator, precedence.PREFIX, (token, right) => ({
      value: token.match,
      right,
      toString() { return `(${operator}${right})` },
    }))
  }

  for (const operator of [ '+', '-' ]) {
    parser.infix(operator, precedence.SUM, parser.LEFT_ASSOCIATIVE, (token, left, right) => ({
      value: token.match,
      left,
      right,
      toString() { return `(${left} ${operator} ${right})` },
    }))
  }

  for (const operator of [ '*', '/' ]) {
    parser.infix(operator, precedence.PRODUCT, parser.LEFT_ASSOCIATIVE, (token, left, right) => ({
      value: token.match,
      left,
      right,
      toString() { return `(${left} ${operator} ${right})` },
    }))
  }

  parser

  .postfix('!', precedence.POSTFIX, (token, left) => ({
    value: token.match,
    toString() { return `(${left}!)` }, left
  }))

  .infix('^', precedence.EXPONENT, parser.RIGHT_ASSOCIATIVE, (token, left, right) => ({
    value: token.match,
    toString() { return `(${left}^${right})` },
    left, right
  }))

  return parser
}