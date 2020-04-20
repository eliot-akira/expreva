import { Parser } from '../Parser'
import { Precedence } from './constants'

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
    parser.infix(operator, Precedence.CONDITIONAL, Parser.LEFT_ASSOC, (token, left, right) => ({
      value: token.match,
      toString() { return `(${left} ${operator} ${right})` },
      left,
      right
    }))
  }


  return parser
}