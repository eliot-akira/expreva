import { Parser } from '../Parser'
import { Expression } from '../evaluate'
import { TokenType } from '../TokenType'

export default [

  {
    match: /^(\()/,
    type: TokenType.openExpression,
    power: 80,
    prefix(parser: Parser) {

      console.log('( -->')

      const exprs = []
      let expr, token = parser.current()

      while (token && token.type!==TokenType.closeExpression) {

        while ((expr = parser.parseExpression(this.power)) != null) {
          exprs.push(expr)
          // console.log(',')
        }

        token = parser.current()
        // console.log('Next token', token.type, token && token.type!==TokenType.closeList)
      }

      const len = exprs.length

      if (!len) return
      if (len===1) return exprs[0]
      // if (len > 1) exprs.unshift('do')

      console.log(') <--', exprs)
      return exprs

      /*
      let level = ++parser.expressionLevel

      let expr = parser.parseExpression(0)
      if (parser.expressionLevel < level) {
        return expr
      }

      let current = parser.current()
      // Parse to right parenthesis or next statement
      let next
      const nexts = []
      const power = current.value!==')' ? 0 : this.power
      while((current = parser.current()) && (next = parser.parseExpression(current.value!==')' ? 0 : this.power))!=null ) {
        nexts.push(next)
      }

      parser.scheduleExpression(...nexts)
      expr = parser.withNextStatements(this.power, expr as Expression)

      // Disambiguate between x and (x)
      if (typeof expr==='string') return ['do', expr]

      return expr
*/
    },
    infix(parser: Parser, left: Expression) {
      return parser.parseExpression(0)
/*
      let level = ++parser.expressionLevel

      // Function call
      const isFunc = typeof left==='string' || Array.isArray(left)
      let expr = parser.parseExpression(0)
      if (parser.expressionLevel < level) {
        if (isFunc) {
          return [left, expr]
        }
        // Separate statements
        return ['do', left, expr]
      }

      let current = parser.current()
      if (current) {

        // Parse to right parenthesis or next statement
      let next
      const nexts = []
      const power = current.value!==')' ? 0 : this.power
      while((next = parser.parseExpression(power))!=null) {
        nexts.push(next)
      }

      parser.scheduleExpression(...nexts)

    }

      expr = parser.withNextStatements(this.power, expr as Expression)

      if (left==null) return expr
      return [left, expr]
*/
    },
  },
  {
    match: /^(\))/,
    type: TokenType.closeExpression,
    power: 0,
    prefix(parser: Parser) {},
    infix(parser: Parser) {},
  },

]