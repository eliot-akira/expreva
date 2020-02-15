export const TEOF = 'TEOF'
export const TOP = 'TOP'
export const TNAME = 'TNAME'
export const TNUMBER = 'TNUMBER'
export const TSTRING = 'TSTRING'
export const TPAREN = 'TPAREN'
export const TBRACKET = 'TBRACKET'
export const TCOMMA = 'TCOMMA'
export const TCOLON = 'TCOLON'
export const TELLIPSIS = 'TELLIPSIS'
export const TSEMICOLON = 'TSEMICOLON'

export type TokenType = 'TEOF' | 'TOP' | 'TNAME' | 'TNUMBER' | 'TSTRING' | 'TPAREN' | 'TBRACKET' | 'TCOMMA' | 'TCOLON' | 'TELLIPSIS' | 'TSEMICOLON'
export type TokenValue = string | number

export class Token {

  constructor(
    public type: TokenType,
    public value: TokenValue,
    public index: number
  ) {}

  toString() {
    return this.type + ':' + this.value
  }
}
