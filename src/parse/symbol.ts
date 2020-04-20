import { Parser } from '../Parser'
import { Precedence } from './constants'

export default function(parser) {

  parser

  // Symbols

  .nullary('NUMBER', (token) => ({
    value: Number(token.match),
    toString() { return this.value },
  }))

  .nullary('IDENTIFIER', (token) => ({
    value: token.match,
    toString() { return this.value },
  }))

  // String

  .nullary('STRING_SINGLE', (token) => ({
    value: [
      'expr',
      JSON.parse(`"${token.match.slice(1, -1).replace(/\\'/g, "'")}"`)
    ],
    toString() { return token.match },
  }))

  .nullary('STRING_DOUBLE', (token) => ({
    value: [
      'expr',
      JSON.parse(token.match)
    ],
    toString() { return token.match },
  }))

  // Comment - IDEA: Hang documentation on variables

  .nullary('COMMENT', (token) => ({
    toString() { return '' },
    comment: token.match
  }))

  .nullary('COMMENT_BLOCK', (token) => ({
    toString() { return '' },
    comment: token.match
  }))

  // New lines

  .register('NEWLINE', {
    parse(parser, token) {
      const left = parser.parse(0)
      return {
        // value: token.match,
        toString() { return ''+left },
        left
      }
    }
  }, Parser.PREFIX)

  .register('NEWLINE', {
    precedence: Precedence.STATEMENT,
    parse(parser, token, left) {
      // const right = parser.parse(0)
      return {
        // value: token.match,
        toString() { return ''+left },
        left,
      }
    }
  }, Parser.XFIX)

// .nullary('NEWLINE', (token) => ({
//   value: token.match,
//   toString() { return this.value },
// }))

  return parser
}