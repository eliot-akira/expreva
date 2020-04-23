import { precedence } from './constants'

export default function(parser) {

  parser

  // Function

  .infix('=>', precedence.ASSIGNMENT, parser.RIGHT_ASSOCIATIVE, (token, left, right) => {

    // Single argument x =>
    if (left.hasOwnProperty('value')) {
      if (left==null) left = []
      else left = [left]
    }

    if (left.expressions) {
      // Convert to arguments to ensure array
      left.args = left.expressions
      delete left.expressions
    }

    return {
      value: 'λ',
      args: [left, right],
      toString() { return `${left} => ${right}` },
    }
  })

  // Apply to function

  .register('->', {
    precedence: precedence.CALL,
    parse(parser, token, left) {

      let right

      // Handle special case: x -> y => z
      const nextNextToken = parser.peek(1)
      if (nextNextToken && nextNextToken.type==='=>') {
        // Get the whole lambda definition
        right = parser.parse(0)
      } else {
        right = parser.parse(this.precedence)
      }

      return {
        args: [right, left],
        toString() { return `${left} -> ${right}` },
      }
    }
  }, parser.XFIX)

  return parser
}