import {
  Token,
  TEOF,
  TOP,
  TNUMBER,
  TSTRING,
  TPAREN,
  TBRACKET,
  TCOMMA,
  TNAME,
  TCOLON,
  TSEMICOLON
} from './token'
import { toUtf16 } from './utils'

const ALPHANUMERIC_PATTERN = /^[0-9a-zA-Z]{1}$/i
const CODEPOINT_CHAR_PATTERN = /^[0-9a-f]{1}$/i
const CODEPOINT_PATTERN = /^[0-9a-f]{4}$/i
// TODO: Range of code point
const EXTENDED_CODEPOINT_PATTERN = /^[0-9a-f]{5}$/i

export default function tokenize(parser, source) {
  return new Tokenizer(parser, source)
}

export class Tokenizer {

  constructor(parser, source) {
    this.pos = 0
    this.current = null

    this.unaryOps = parser.unaryOps
    this.binaryOps = parser.binaryOps
    this.ternaryOps = parser.ternaryOps
    this.consts = parser.consts
    this.source = source

    this.savedPosition = 0
    this.savedCurrent = null
    this.options = parser.options
  }

  newToken(type, value, pos) {
    return new Token(type, value, pos != null ? pos : this.pos)
  }

  getCoordinates() {
    let line = 0
    let column
    let newline = -1
    do {
      line++
      column = this.pos - newline
      newline = this.source.indexOf('\n', newline + 1)
    } while (newline >= 0 && newline < this.pos)
    return {
      line: line,
      column: column
    }
  }

  parseError(msg) {
    const coords = this.getCoordinates()
    throw new Error('Parse error in line ' + coords.line + ', column ' + coords.column + ': ' + msg)
  }

  save() {
    this.savedPosition = this.pos
    this.savedCurrent = this.current
  }
  restore() {
    this.pos = this.savedPosition
    this.current = this.savedCurrent
  }

  next() {
    if (this.pos >= this.source.length) {
      return this.newToken(TEOF, 'EOF')
    }
    if (this.isWhitespace() || this.isComment()) {
      return this.next()
    } else if (
      this.isRadixInteger() ||
      this.isNumber() ||
      this.isOperator() ||
      this.isString() ||
      this.isParen() ||
      this.isBracket() ||
      this.isComma() ||
      this.isSemicolon() ||
      this.isNamedOp() ||
      this.isConst() ||
      this.isName()
    ) {
      return this.current
    } else {
      this.parseError('Unknown character "' + this.source.charAt(this.pos) + '"')
    }
  }

  isString() {
    let r = false
    let startPos = this.pos
    const quote = this.source.charAt(startPos)
    if (quote === '\'' || quote === '"') {
      let index = this.source.indexOf(quote, startPos + 1)
      while (index >= 0 && this.pos < this.source.length) {
        this.pos = index + 1
        if (this.source.charAt(index - 1) !== '\\') {
          const rawString = this.source.substring(startPos + 1, index)
          this.current = this.newToken(TSTRING, this.unescape(rawString), startPos)
          r = true
          break
        }
        index = this.source.indexOf(quote, index + 1)
      }
    }
    return r
  }

  isParen() {
    const c = this.source.charAt(this.pos)
    if (c === '(' || c === ')') {
      this.current = this.newToken(TPAREN, c)
      this.pos++
      return true
    }
    return false
  }

  isBracket() {
    const c = this.source.charAt(this.pos)
    if (c === '[' || c === ']' || c === '{' || c === '}') {
      this.current = this.newToken(TBRACKET, c)
      this.pos++
      return true
    }
    return false
  }

  isComma() {
    const c = this.source.charAt(this.pos)
    if (c === ',') {
      this.current = this.newToken(TCOMMA, ',')
      this.pos++
      return true
    }
    return false
  }

  isSemicolon() {
    const c = this.source.charAt(this.pos)
    if (c === ';') {
      this.current = this.newToken(TSEMICOLON, ';')
      this.pos++
      return true
    }
    return false
  }

  isConst() {
    let startPos = this.pos
    let i = startPos
    for (; i < this.source.length; i++) {
      const c = this.source.charAt(i)
      if (c.toUpperCase() === c.toLowerCase()) {
        if (i === this.pos || (c !== '_' && c !== '.' && (c < '0' || c > '9'))) {
          break
        }
      }
    }
    if (i > startPos) {
      const str = this.source.substring(startPos, i)
      if (str in this.consts) {
        this.current = this.newToken(TNUMBER, this.consts[str])
        this.pos += str.length
        return true
      }
    }
    return false
  }

  isNamedOp() {
    let startPos = this.pos
    let i = startPos
    for (; i < this.source.length; i++) {
      const c = this.source.charAt(i)
      if (c.toUpperCase() === c.toLowerCase()) {
        if (i === this.pos || (c !== '_' && (c < '0' || c > '9'))) {
          break
        }
      }
    }
    if (i > startPos) {

      const str = this.source.substring(startPos, i)

      if (str in this.unaryOps || str in this.binaryOps || str in this.ternaryOps) {
        this.current = this.newToken(TOP, str)
        this.pos += str.length
        return true
      }
    }
    return false
  }

  isName() {
    const startPos = this.pos
    let i = startPos
    let hasLetter = false
    for (; i < this.source.length; i++) {
      let c = this.source.charAt(i)
      if (c.toUpperCase() === c.toLowerCase()) {
        if (i === this.pos && (c === '$' || c === '_')) {
          if (c === '_') {
            hasLetter = true
          }
          continue
        }
        else if (i === this.pos || !hasLetter || (c !== '_' && (c < '0' || c > '9'))) {
          break
        }
      } else {
        hasLetter = true
      }
    }
    if (hasLetter) {

      const str = this.source.substring(startPos, i)
      this.current = this.newToken(TNAME, str)
      this.pos += str.length

      return true
    }
    return false
  }

  isWhitespaceChar(c) {
    return c === ' ' || c === '\t' || c === '\n' || c === '\r'
  }

  isWhitespace() {
    let r = false
    let c = this.source.charAt(this.pos)
    while (this.isWhitespaceChar(c)) {
      r = true
      this.pos++
      if (this.pos >= this.source.length) {
        break
      }
      c = this.source.charAt(this.pos)
    }
    return r
  }

  unescape(v) {
    let index = v.indexOf('\\')
    if (index < 0) {
      return v
    }
    let buffer = v.substring(0, index)
    let codePoint, str
    while (index >= 0) {
      let c = v.charAt(++index)
      switch (c) {
      case '\'':
        buffer += '\''
        break
      case '"':
        buffer += '"'
        break
      case '\\':
        buffer += '\\'
        break
      case '/':
        buffer += '/'
        break
      case 'b':
        buffer += '\b'
        break
      case 'f':
        buffer += '\f'
        break
      case 'n':
        buffer += '\n'
        break
      case 'r':
        buffer += '\r'
        break
      case 't':
        buffer += '\t'
        break
      case 'u':
        // Interpret the following 4 characters as the hex of the unicode code point
        codePoint = v.substring(index + 1, index + 5)
        if (!CODEPOINT_PATTERN.test(codePoint)) {
          this.parseError('Invalid escape sequence: \\u' + codePoint)
        }
        buffer += String.fromCharCode(parseInt(codePoint, 16))
        index += 4
        break
      case 'U':
        // TODO: Improve logic for extracting hex..
        // U+0000 or U+00000
        codePoint = v.substring(index + 2, index + 6)
        index += 5
        str = v.substring(index + 1, index + 2)
        if (str && CODEPOINT_CHAR_PATTERN.test(str)) {
          codePoint += str
          index++
        }
        if (!CODEPOINT_PATTERN.test(codePoint) && !EXTENDED_CODEPOINT_PATTERN.test(codePoint)) {
          this.parseError('Invalid escape sequence: \\U+' + codePoint)
        }
        buffer += toUtf16(parseInt(codePoint, 16)) //String.fromCharCode(parseInt(codePoint, 16))
        break
      default:
        throw this.parseError('Invalid escape sequence: "\\' + c + '"')
      }
      ++index
      let backslash = v.indexOf('\\', index)
      buffer += v.substring(index, backslash < 0 ? v.length : backslash)
      index = backslash
    }
    return buffer
  }

  isComment() {
    let c = this.source.charAt(this.pos)
    if (c !== '/') return false

    c = this.source.charAt(this.pos + 1)
    if (c !== '*' && c !== '/') return false

    const isShortComment = c === '/'
    const endToken = isShortComment ? '\n' : '*/'

    this.pos = this.source.indexOf(endToken, this.pos)

    if (this.pos === -1) {
      // End token not found
      this.pos = this.source.length
    } else {
      this.pos += endToken.length
    }

    return true
  }

  isRadixInteger() {
    let pos = this.pos
    if (pos >= this.source.length - 2 || this.source.charAt(pos) !== '0') {
      return false
    }
    ++pos
    let radix
    let validDigit
    if (this.source.charAt(pos) === 'x') {
      radix = 16
      validDigit = /^[0-9a-f]$/i
      ++pos
    } else if (this.source.charAt(pos) === 'b') {
      radix = 2
      validDigit = /^[01]$/i
      ++pos
    } else {
      return false
    }
    let valid = false
    let startPos = pos
    while (pos < this.source.length) {
      let c = this.source.charAt(pos)
      if (validDigit.test(c)) {
        pos++
        valid = true
      } else {
        break
      }
    }
    if (valid) {
      this.current = this.newToken(TNUMBER, parseInt(this.source.substring(startPos, pos), radix))
      this.pos = pos
    }
    return valid
  }

  isNumber() {
    let valid = false
    let pos = this.pos

    let prevPos = pos - 1
    let prevChar

    let startPos = pos
    let resetPos = pos
    let foundDot = false
    let foundDigits = false
    let c

    // Skip whitespace to last char
    while ((prevChar = this.source.charAt(prevPos)) && this.isWhitespaceChar(prevChar)) {
      prevPos--
    }

    foundDot = prevChar==='.' // Following a member operator

    // Get number string

    while (pos < this.source.length) {
      c = this.source.charAt(pos)
      if (pos===startPos && c==='-' || (c >= '0' && c <= '9') || (!foundDot && c === '.')) {
        if (c === '.') {
          foundDot = true
        } else if (c !== '-') {
          foundDigits = true
        }
        pos++
        valid = foundDigits
      } else {
        break
      }
    }

    let numString = valid && this.source.substring(startPos, pos)

    const isAfterExpression = prevChar
      && (
        prevChar === ')' || prevChar === ']' || prevChar === '}'
        || prevChar === '\'' || prevChar === '"'
        || prevChar === '.'
        || ALPHANUMERIC_PATTERN.test(prevChar) //(prevChar.toUpperCase()!==prevChar.toLowerCase()) // Alphabet
      )

    const isMember = isAfterExpression && numString && numString[0] === '.'

    if (isMember || !valid) {
      this.pos = resetPos
      return false
    }

    resetPos = pos

    if (c === 'e' || c === 'E') {
      pos++
      let acceptSign = true
      let validExponent = false
      while (pos < this.source.length) {
        c = this.source.charAt(pos)
        if (acceptSign && (c === '+' || c === '-')) {
          acceptSign = false
        }
        else if (c >= '0' && c <= '9') {
          validExponent = true
          acceptSign = false
        }
        else {
          break
        }
        pos++
      }
      if (validExponent) {
        numString = this.source.substring(startPos, pos)
      } else {
        pos = resetPos
      }
    }

    // TODO: Wrap in number type for float (default), big number

    this.current = this.newToken(TNUMBER, parseFloat(numString))
    this.pos = pos
    return true
  }

  isOperator() {
    let startPos = this.pos
    let c = this.source.charAt(this.pos)
    let nextC
    if (c === '+' || c === '*' || c === '/' || c === '%' || c === '^'
      || c === '.' || c === '?' || c === ':'
    ) {
      this.current = this.newToken(TOP, c)
    } else if (c === '∙' || c === '•') {
      this.current = this.newToken(TOP, '*')
    } else if (c === '-') {
      if (this.source.charAt(this.pos + 1) === '>') {
        this.current = this.newToken(TOP, '->')
        this.pos++
      } else {
        this.current = this.newToken(TOP, '-')
      }
    } else if (c === '>') {
      if (this.source.charAt(this.pos + 1) === '=') {
        this.current = this.newToken(TOP, '>=')
        this.pos++
      } else {
        this.current = this.newToken(TOP, '>')
      }
    } else if (c === '<') {
      if (this.source.charAt(this.pos + 1) === '=') {
        this.current = this.newToken(TOP, '<=')
        this.pos++
      } else {
        this.current = this.newToken(TOP, '<')
      }
    } else if (c === '|') {
      if (this.source.charAt(this.pos + 1) === '|') {
        this.current = this.newToken(TOP, '||')
        this.pos++
      } else {
        // Bit shift?
        return false
      }
    } else if (c === '&') {
      if (this.source.charAt(this.pos + 1) === '&') {
        this.current = this.newToken(TOP, '&&')
        this.pos++
      } else {
        // Bit shift?
        return false
      }
    } else if (c === '=') {
      nextC = this.source.charAt(this.pos + 1)
      if (nextC === '=') {
        this.current = this.newToken(TOP, '==')
        this.pos++
      } else if (nextC === '>') {
        this.current = this.newToken(TOP, '=>')
        this.pos++
      } else {
        this.current = this.newToken(TOP, c)
      }
    } else if (c === '!') {
      if (this.source.charAt(this.pos + 1) === '=') {
        this.current = this.newToken(TOP, '!=')
        this.pos++
      } else {
        this.current = this.newToken(TOP, c)
      }
    } else {
      return false
    }
    this.pos++

    return true
  }
}
