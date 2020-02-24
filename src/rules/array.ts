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
      let expr
      while ((expr = parser.parseExpression(this.power)) != null) {
        if (expr==='listEnd') break
        if (expr===',') continue
        if (Array.isArray(expr) && expr[0]==='args..') {
          exprs.push(...expr.slice(1))
          continue
        }
        exprs.push(expr)
      }

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