import { precedence } from './constants'

export default function(parser) {

  parser

  // Conditional

  .register('?', {
    precedence: precedence.CONDITIONAL,
    parse(parser, token, left) {

      const trueBranch = parser.parse(0)

      parser.consume(':')

      const elseBranch = parser.parse(this.precedence - 1)

      const ifNode = {
        value: 'if',
        toString() { return this.value },
      }

      return {
       args: [ifNode, left, trueBranch, elseBranch],
       toString() { return `(${left} ? ${trueBranch} : ${elseBranch})` },
      }
    }
  }, parser.XFIX)

  return parser
}
