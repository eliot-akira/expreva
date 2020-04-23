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

  .infix('->', precedence.CALL, parser.LEFT_ASSOCIATIVE, (token, left, right) => {
    return {
      args: [right, left],
      toString() { return `${left} -> ${right}` },
    }
  })

  return parser
}