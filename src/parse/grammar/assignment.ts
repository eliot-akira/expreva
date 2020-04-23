import { precedence } from './constants'

export default function(parser) {

  parser

  // Assignment

  .infix('=', precedence.ASSIGNMENT, parser.RIGHT_ASSOCIATIVE, (token, left, right) => ({
    value: 'def',
    left,
    right,
    toString(){ return `(${left}=${right})` },
  }))

  // Compound assignment

  for (const operator of ['+', '-', '*', '/']) {

    parser.infix(`${operator}=`, precedence.ASSIGNMENT, parser.RIGHT_ASSOCIATIVE, (token, left, right) => ({
      value: 'def',
      left,
      right: {
        value: operator,
        left,
        right,
        // toString() { return `(${left} ${operator} ${right})` },
      },
      toString() { return `(${left} ${operator}= ${right})` },
    }))
  }

  for (const operator of ['+', '-']) {

    parser.postfix(`${operator}${operator}`, precedence.POSTFIX, (token, left) => ({
      value: 'def',
      left,
      right: {
        value: operator,
        left,
        right: { value: 1 },
        // toString() { return `(${left} ${operator} ${right})` },
      },
      toString() { return `(${left}${operator}${operator})` },
    }))
  }

  return parser
}
