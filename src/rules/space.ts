import { Parser } from '../Parser'
import { Expression } from '../evaluate'
import { TokenType } from '../TokenType'

export default [
  {
    match: /^([ \t])/, // Was \s
    type: TokenType.space,
    power: 0,
    prefix() {},
    infix() {},
  },
  {
    match: /^([\r\n])/,
    type: TokenType.newLine,
    power: 0,
    prefix() {},
    infix() {},
  },
]
