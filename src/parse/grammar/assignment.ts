import { precedence } from './constants'

export default function(parser) {

  parser

  // Assignment

  .infix('=', precedence.ASSIGNMENT, parser.RIGHT_ASSOCIATIVE, (token, left, right) => {
    return {
      value: 'def',
      left,
      right,
      toString(){ return `(${left}=${right})` },
    }
  })

  return parser
}
