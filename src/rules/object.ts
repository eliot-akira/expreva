import { Parser } from '../parser'
import { Expression } from '../evaluate'

/** Quote string, otherwise pass through */
const quoteString = (v: Expression) => typeof v==='string' ? ['`', v] : v

export default [

  {
    match: /^\s*(\})\s*/,
    name: 'close object',
    power: 0,
    prefix() {},
    infix() {},
  },
  {
    match: /^\s*(\{)\s*/,
    name: 'open object',
    power: 80,
    prefix(parser: Parser) {
      const expr = parser.parseExpression(0)
      // Gather key-value pairs
      const allPairs = expr==null ? [] : [expr]
      let next
      while (next = parser.parseExpression(0)) {
        if (!next || next[0]!=='pair') break
        allPairs.push(next)
      }
      if (next!=null) parser.pushNextExpression(next)
      return ['obj', ...allPairs.map(a => {
        (a as []).shift() // Remove keyword "pair"
        return a
      })]
    },
    infix(parser: Parser, left: Expression) {},
  },

  {
    match: /^\s*(\.)\s*/,
    name: 'member',
    power: 80,
    prefix(parser: Parser) {
      const right = parser.parseExpression(0)
      return right==null ? right : parseFloat(`0.${right}`)
    },
    infix(parser: Parser, left) {
      let right = parser.parseExpression(this.power)
      if (right==null) return left
      if (Array.isArray(right) && right[0]==='get') {
        return ['get', left, quoteString(right[1]), ...right.slice(2)]
      }
      return ['get', left, quoteString(right)]
    }
  },
]