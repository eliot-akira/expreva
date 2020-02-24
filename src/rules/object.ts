import { Parser } from '../parser'
import { Expression } from '../evaluate'

/** Quote string, otherwise pass through */
const quoteString = (v: Expression) => typeof v==='string' ? ['`', v] : v

export default [
  {
    match: /^\s*(\{)\s*/,
    name: 'open object',
    power: 80,
    prefix(parser: Parser) {

      // Gather key-value pairs

      const pairs = []
      let expr, mergeNext = false
      while ((expr = parser.parseExpression(this.power)) != null) {
        if (expr==='objEnd') break
        if (expr===':') {
          mergeNext = true
          continue
        }
        if (mergeNext) {
          const prev = pairs.pop()
          prev[1] = expr // { x: y }
          pairs.push(prev)
          mergeNext = false
          continue
        }
        pairs.push([expr, expr]) // { x } by default
      }

      return ['obj', ...pairs]
    },
    infix(parser: Parser, left: Expression) {
      return ['objStart', left]
    },
  },
  {
    match: /^\s*(\})\s*/,
    name: 'close object',
    power: 0,
    prefix(parser: Parser) {
      return 'objEnd'
    },
    infix() {},
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