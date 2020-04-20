import { Parser } from '../Parser'
import { Precedence } from './constants'

export default function(parser) {

  parser

  // Assignment

  .infix('=', Precedence.ASSIGNMENT, Parser.RIGHT_ASSOC, (token, left, right) => {
    return {
      value: 'def',
      toString(){ return `(${left}=${right})` },
      left,
      right
    }
  })

  return parser
}
