import { Parser } from '../Parser'
import { Precedence } from './constants'

export default function(parser) {

  parser

// Function

.infix('=>', Precedence.ASSIGNMENT, Parser.RIGHT_ASSOC, (token, left, right) => {

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
    toString() { return `${left} => ${right}` },
    args: [left, right]
  }
})


  return parser
}