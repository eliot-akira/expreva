import { Parser } from '../Parser'
import { Expression } from '../evaluate'
import { TokenType } from '../TokenType'

export default [
  // Array
  {
    match: /^(\[)/,
    type: TokenType.openList,
    power: 0,
    prefix(parser: Parser) {

      console.log('[ -->')

      const exprs = []
      let expr, token

      do {

      while ((expr = parser.parseExpression(0)) != null) {
        exprs.push(expr)
        // console.log(',')
      }

      token = parser.current()
      // console.log('Next token', token.type, token && token.type!==TokenType.closeList)

    } while (token && token.type!==TokenType.closeList)

      exprs.unshift('list')

      console.log('] <--', exprs)

      return exprs

/*      let exprs = []
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
*/
    },
    infix(parser: Parser, left: Expression) {},
  },
  {
    match: /^(\])/,
    type: TokenType.closeList,
    power: 0,
    prefix(parser) {
      console.log('] pre')
      // return 'listEnd'
    },
    infix(parser: Parser, left: Expression[]) {
      console.log('] in')
      return left
    },
  },
]