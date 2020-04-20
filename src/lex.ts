import { Lexer } from './Lexer'

const lexer = new Lexer()

// .token('WHITESPACE', /^\s+/, true) // Skip

.token('WHITESPACE', /^([ \t]+)/, true) // Skip
.token('NEWLINE', /^([\r\n]+)/)
.token('COMMENT', /^(\/(\*)[^*]*\*+(?:[^*\/][^*]*\*+)*\/)/)
.token('COMMENT_BLOCK', /^(\/(\/)[^\n]*($|\n))/)

.token('(', /^(\()/)
.token(')', /^(\))/)
.token('[', /^(\[)/)
.token(']', /^(\])/)
.token('{', /^(\{)/)
.token('}', /^(\})/)

.token(';', /^(;+)/)
.token('?', /^(\?)/)
.token(':', /^(:)/)
.token('.', /^(\.)/)
.token(',', /^(\,)/)

.token('->', /^(->)/)
.token('=>', /^(=>)/)

.token('==', /^(==)/)
.token('!=', /^(\!=)/)
.token('!', /^(\!)/)
.token('<=', /^(<=)/)
.token('<', /^(<)/)
.token('>=', /^(>=)/)
.token('>', /^(>)/)

.token('||', /^(\|\|)/)
.token('&&', /^(&&)/)

.token('=', /^(=)/)
.token('+', /^(\+)/)
.token('-', /^(-)/)
.token('*', /^(\*)/)
.token('/', /^(\/)/)

.token('NUMBER', /^(\d+)/)
.token('IDENTIFIER', /^([a-zA-Z0-9_]+)/)
.token('STRING_SINGLE', /^\'([^\'\\]*(\\.[^\'\\]*)*)\'/)
.token('STRING_DOUBLE', /^"([^"\\]*(\\.[^"\\]*)*)"/)

export default  function lex(source: string) {
  lexer.source = source
  const tokens = lexer.toArray()
  // console.log('lexed', tokens.map(t => Object.assign(t, t.strpos())))
  return tokens
}
