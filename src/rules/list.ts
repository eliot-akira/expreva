import { Parser } from '../Parser'
import { Expression } from '../evaluate'

export default [
  // Array
  {
    match: /^\s*(\[)\s*/,
    name: 'open list',
    power: 80,
    prefix(parser: Parser) {
      // Gather items

      let exprs = []
      let expr = parser.parseExpression(0)
      if (expr==null) return ['list']
      do {
        if (expr==='listEnd') break
        if (expr===',') continue
        if (Array.isArray(expr) && expr[0]==='args..') {
          expr.shift()
          // Handle trailing comma
          const last = expr.pop()
          if (last==='listEnd') {
            exprs.push(...expr)
            break
          }
          expr.push(last as Expression)
          exprs.push(...expr)
          continue
        }

        exprs.push(expr)

      } while ((expr = parser.parseExpression(this.power)) != null)

      return ['list', ...exprs]
    },
    infix(parser: Parser, left: Expression) {},
  },
  {
    match: /^\s*(\])\s*/,
    name: 'close list',
    power: 0,
    prefix(parser) {
      return 'listEnd'
    },
    infix(parser: Parser, left: Expression[]) {},
  },
]