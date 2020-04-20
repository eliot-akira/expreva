import { Parser } from '../Parser'
import { Precedence } from './constants'

export default function(parser) {

  parser

  // Conditional

  .register('?', {
    precedence: Precedence.CONDITIONAL,
    parse(parser, token, left) {
      const thenArm = parser.parse(0)
      parser.consume(':')
      const elseArm = parser.parse(this.precedence - 1)

      return { toString() { return `(${left}?${thenArm}:${elseArm})` }, left, thenArm, elseArm }
    }
  }, Parser.XFIX)

  return parser
}