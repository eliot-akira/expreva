import { precedence } from './constants'

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
    comment: token.match,
    toString() { return '' },
  }))

  .nullary('COMMENT_BLOCK', (token) => ({
    comment: token.match,
    toString() { return '' },
  }))

  // New lines

  .register('NEWLINE', {
    parse(parser, token) {
      const left = parser.parse(0)
      return {
        // value: token.match,
        left,
        toString() { return ''+left },
      }
    }
  }, parser.PREFIX)

  .register('NEWLINE', {
    precedence: precedence.STATEMENT,
    parse(parser, token, left) {
      // const right = parser.parse(0)
      return {
        // value: token.match,
        left,
        toString() { return ''+left },
      }
    }
  }, parser.XFIX)

// .nullary('NEWLINE', (token) => ({
//   value: token.match,
//   toString() { return this.value },
// }))

  return parser
}