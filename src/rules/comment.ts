import { Parser } from '../Parser'
import { Expression } from '../evaluate'

export default [

  // Comments, single and multi-line - filtered out by lexer
  {
    match: /^\s*(\/(\*)[^*]*\*+(?:[^*\/][^*]*\*+)*\/)\s*/,
    name: 'comment',
    power: 0,
    prefix(parser: Parser) {
      // return ['comment', ['`', this.value.replace(/^\/\*\s*|\s*\*\/$/g, '')]]
    },
    infix(parser: Parser, left) {},
  },

  {
    match: /^\s*(\/(\/)[^\n]*($|\n))/,
    name: 'comment',
    power: 0,
    prefix(parser: Parser) {
      // return ['comment', ['`', this.value.replace(/^\/\/\s*/, '')]]
    },
    infix(parser: Parser, left) {},
  },

]