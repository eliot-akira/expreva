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

export class Token {
  constructor(type, value, index) {
    this.type = type
    this.value = value
    this.index = index
  }
  toString() {
    return this.type + ':' + this.value
  }
}
