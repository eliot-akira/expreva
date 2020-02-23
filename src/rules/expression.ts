import { Parser } from '../Parser'
import { Expression } from '../evaluate'

export default [
  {
    match: /^\s*(\(\s*\))\s*/,
    name: 'empty list',
    power: 80,
    prefix(parser) {},
    infix(parser: Parser, left: Expression[]) {
      return left!=null ? [left] : ['list']
    },
  },
  {
    match: /^\s*(\()\s*/,
    name: 'open expression',
    power: 80,
    prefix(parser: Parser) {

      parser.expressionLevel++

      // Capture statements
      let subExprs: Expression[] = []
      parser.pushExpressionCapturer((subExpr: Expression[]) => {
        subExprs.unshift(...subExpr)
      })

      let expr = parser.parseExpression(0)
      if (subExprs.length) {
        expr = ['do', expr, ...subExprs]
      }
      parser.popExpressionCapturer()

      // Parse to right parenthesis
      parser.parseExpression(this.power)

      parser.expressionLevel--

      return expr // parser.handleNextExpressions(expr as Expression)
    },
    infix(parser: Parser, left: Expression) {
      const right = parser.parseExpression(0)
      // Parse to right parenthesis
      parser.parseExpression(this.power)
      if (left==null) return right
      return [left, right]
    },
  },
  {
    match: /^\s*;*\s*(\))\s*/, // ), ;)
    name: 'close expression',
    power: 0,
    prefix() {},
    infix() {},
  },

  {
    match: /^\s*(;+)\s*/,
    name: 'end statement',
    power: 100,
    prefix() {},
    infix(parser: Parser, left: Expression[]) {
      const right = parser.parseExpression(0)
      if (right!=null) {
        parser.nextExpressions.unshift(right) // ';',
        if (parser.captureExpressions(parser.nextExpressions)) {
          parser.nextExpressions = []
        }
      }
      return left
    },
  },
]