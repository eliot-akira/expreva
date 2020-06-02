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

      // Get the whole expression following
      // 1 -> x => y
      // 1 -> (x,y) => z
      let nextNextToken
      if (((nextNextToken = parser.peek(0)) && nextNextToken.type==='(')
        || ((nextNextToken = parser.peek(1)) &&  nextNextToken.type==='=>')
      ) {
        right = parser.parse(0)
      } else {
        right = parser.parse(this.precedence)
      }

      if (left.expressions) {
        // Spread to arguments
        left = left.expressions
      }
      if (!Array.isArray(left)) left = [left]

      return {
        args: [right, ...left],
        toString() { return `${left} -> ${right}` },
      }
    }
  }, parser.XFIX)

  return parser
}