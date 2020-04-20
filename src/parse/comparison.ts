import { Parser } from '../Parser'
import { Precedence } from './constants'

export default function(parser) {

  parser

  .infix('>', Precedence.CONDITIONAL, Parser.LEFT_ASSOC, (token, left, right) => ({
    value: token.match,
    toString() { return `(${left}>${right})` },
    left,
    right
  }))

  return parser
}