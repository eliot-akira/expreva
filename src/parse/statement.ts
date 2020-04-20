import { Parser } from '../Parser'
import { Precedence } from './constants'
import { createDoExpression } from './utils'

export default function(parser) {

  parser

  // Statement

  .register(';', {
    precedence: Precedence.STATEMENT,
    parse(parser, token, left) {

      let expressions = [left]
      let i = 1

      do {

        // Can be last token in expression, as a postfix
        if ( ! parser.peek(0) ) break

        const expression = parser.parse(0)

        // Merge multiple statements

        if (expression.expressions && expression.expressions[0]
          && expression.expressions[0].value==='do'
        ) {
          expressions.push(...expression.expressions[0].args)
        } else {
          expressions.push(expression)
        }

        i++

      } while (parser.match(';'))

      if (i > 1) {
        expressions = [
          createDoExpression(expressions)
        ]
      }

      return {
        toString() { return `(${expressions.join(';')})` },
        expressions,
      }
    }
  }, Parser.XFIX)

  return parser
}
