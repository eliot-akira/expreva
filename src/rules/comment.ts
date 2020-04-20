import { Parser } from '../Parser'
import { Expression } from '../evaluate'
import { TokenType } from '../TokenType'

export default [

  // Comments, single and multi-line - filtered out by lexer
  {
    match: /^(\/(\*)[^*]*\*+(?:[^*\/][^*]*\*+)*\/)/,
    type: TokenType.comment,
    power: 0,
    prefix(parser: Parser) {
      // return ['comment', ['`', this.value.replace(/^\/\*\s*|\s*\*\/$/g, '')]]
    },
    infix(parser: Parser, left) {},
  },

  {
    match: /^(\/(\/)[^\n]*($|\n))/,
    type: TokenType.comment,
    power: 0,
    prefix(parser: Parser) {
      // return ['comment', ['`', this.value.replace(/^\/\/\s/, '').replace(/\n$/, '')]]
    },
    infix(parser: Parser, left) {},
  },

]