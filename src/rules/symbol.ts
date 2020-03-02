import { Parser } from '../Parser'
import { Expression } from '../evaluate'

export default [

  {
    match: /^\s*(\d+)\s*/, // (\d+)?\.? - Let member operator "." process first
    name: 'number',
    power: 0,
    prefix(parser: Parser) {
      return parseFloat(this.value)
    },
    infix(parser: Parser, left) {},
  },

  {
    match: /^\s*([a-zA-Z0-9_]+)\s*/,
    name: 'symbol',
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
    match: /^\s*\'([^\'\\]*(\\.[^\'\\]*)*)\'/,
    name: 'single-quoted string',
    power: 0,
    prefix(parser: Parser) {
      // Unwrap quotes and unescape
      return ['`', JSON.parse(`"${this.value.slice(1, -1).replace(/\\'/g, "'")}"`)]
    }
  },
  {
    match: /^\s*"([^"\\]*(\\.[^"\\]*)*)"/,
    name: 'double-quoted string',
    power: 0,
    prefix(parser: Parser) {
      // Unwrap quotes and unescape
      return ['`', JSON.parse(this.value)]
    }
  },

]