import { precedence } from './constants'

export default function(parser) {

  for (const operator of [
    '>',
    '>=',
    '<',
    '<=',
    '==',
    '!=',
    '&&',
    '||',
  ]) {
    parser.infix(operator, precedence.CONDITIONAL, parser.LEFT_ASSOCIATIVE, (token, left, right) => ({
      value: token.match,
      left,
      right,
      toString() { return `(${left} ${operator} ${right})` },
    }))
  }


  return parser
}