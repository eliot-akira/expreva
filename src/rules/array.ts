import { Parser } from '../Parser'
import { Expression } from '../evaluate'

export default [
  // Array
  {
    match: /^\s*(\[)\s*/,
    name: 'open array',
    power: 80,
    prefix(parser: Parser) {
      let expr = parser.parseExpression(0)
      // Parse to right bracket
      parser.parseExpression(this.power)
      if (expr==null) return ['list']
      if (Array.isArray(expr)) {

        if (expr[0]==='args..') {

          expr[0] = 'list'

          // Merge expresssions pushed by object

          const hasObject = expr.slice(1).reduce((acc, e) => acc || (Array.isArray(e) && e[0]==='obj'), false)

          if (hasObject) {
            let e
            while (e = parser.nextExpressions.shift()) {
              if (Array.isArray(e) && e[0]===';') {
                break
              }
              if (Array.isArray(e) && e[0]==='args..') {
                expr.push(...e.slice(1))
              } else {
                expr.push(e)
              }
            }
          }

          return expr
        }
      }
      return ['list', expr]
    },
    infix(parser: Parser, left: Expression) {},
  },
  {
    match: /^\s*(\])\s*/,
    name: 'close array',
    power: 0,
    prefix(parser) {},
    infix(parser: Parser, left: Expression[]) {},
  },
]