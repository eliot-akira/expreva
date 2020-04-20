import { Parser } from '../Parser'
import { Precedence } from './constants'

export default function(parser) {

  parser

  // Conditional

  .register('?', {
    precedence: Precedence.CONDITIONAL,
    parse(parser, token, left) {

      const trueBranch = parser.parse(0)

      parser.consume(':')

      const elseBranch = parser.parse(this.precedence - 1)

      const ifNode = {
        value: 'if',
        toString() { return this.value },
      }

      return {
       toString() { return `(${left} ? ${trueBranch} : ${elseBranch})` },
       args: [ifNode, left, trueBranch, elseBranch]
      }
    }
  }, Parser.XFIX)

  return parser
}
