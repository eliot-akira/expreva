
export function registerTokens(lexer) {

  return lexer

    // Previously - Ignore white space, tabs, newlines
    // .token('WHITESPACE', /^\s+/, true)

    /**
     * In case we want to have semantically significant new lines, for example, after keyword "return"
     */
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
    .token(',', /^(\,)/)

    .token('...', /^(\.\.\.)/)
    .token('.', /^(\.)/)

    .token('=>', /^(=>)/)
    .token('->', /^(->)/)

    .token('==', /^(==)/)
    .token('!=', /^(\!=)/)
    .token('||', /^(\|\|)/)
    .token('&&', /^(&&)/)

    .token('<=', /^(<=)/)
    .token('<', /^(<)/)
    .token('>=', /^(>=)/)
    .token('>', /^(>)/)

    .token('+=', /^(\+=)/)
    .token('-=', /^(-=)/)
    .token('*=', /^(\*=)/)
    .token('/=', /^(\/=)/)

    .token('++', /^(\+\+)/)
    .token('--', /^(--)/)

    .token('!', /^(\!)/)
    .token('=', /^(=)/)
    .token('+', /^(\+)/)
    .token('-', /^(-)/)
    .token('*', /^(\*)/)
    .token('/', /^(\/)/)
    .token('^', /^(\^)/)

    .token('NUMBER', /^(\d+)/)

    .token('STRING_SINGLE', /^\'([^\'\\]*(\\.[^\'\\]*)*)\'/)
    .token('STRING_DOUBLE', /^"([^"\\]*(\\.[^"\\]*)*)"/)

    // Should be last
    .token('IDENTIFIER', /^(([a-zA-Z0-9_]|[^\u0000-\u007F])+)/)
  }
