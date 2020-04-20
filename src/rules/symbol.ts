import { Parser } from '../Parser'
import { Expression } from '../evaluate'
import { TokenType } from '../TokenType'

export default [

  {
    match: /^(\d+)/, // (\d+)?\.? - Let member operator "." process first
    type: TokenType.number,
    power: 0,
    prefix(parser: Parser) {
      return parseFloat(this.value)
    },
    infix(parser: Parser, left) {},
  },

  {
    match: /^([a-zA-Z0-9_]+)/,
    type: TokenType.symbol,
    power: 0,
    prefix(parser: Parser) {
      return this.value.trim()
    },
    infix(parser: Parser, left) {},
  },

  /**
   * Match quoted strings with escaped characters
   *
   * @see https://stackoverflow.com/questions/249791/regex-for-quoted-string-with-escaping-quotes#answer-10786066
   */
  {
    match: /^\'([^\'\\]*(\\.[^\'\\]*)*)\'/,
    type: TokenType.string,
    power: 0,
    prefix(parser: Parser) {
      // Unwrap quotes and unescape
      return ['`', JSON.parse(`"${this.value.slice(1, -1).replace(/\\'/g, "'")}"`)]
    }
  },
  {
    match: /^"([^"\\]*(\\.[^"\\]*)*)"/,
    type: TokenType.string,
    power: 0,
    prefix(parser: Parser) {
      // Unwrap quotes and unescape
      return ['`', JSON.parse(this.value)]
    }
  },

]