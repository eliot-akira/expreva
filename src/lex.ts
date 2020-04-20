import { Lexer } from './Lexer'

const lexer = new Lexer()

// .token('WHITESPACE', /^\s+/, true)
.token('WHITESPACE', /^([ \t]+)/, true) // Skip
.token('NEWLINE', /^([\r\n]+)/) // In case we want to have semantics with new lines

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
  return lexer
}
