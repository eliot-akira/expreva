import { Parser } from '../Parser'
import { Precedence } from './constants'
import { createDoExpression } from './utils'

export default function(parser) {

  parser

  // Expression

  .register('(', {
    parse(parser, token) {

      let expressions = []

      // There may be no arguments at all.
      if (!parser.match(')')) {

        let i = 0
        do {

          // Expression or argument list
          do {
            expressions.push(parser.parse(0))
          } while (parser.match(','))

          // parser.consume(')') // Single expression only

          // Keep consuming expressions
          i++
        } while (!parser.match(')') && parser.peek(0))

        if (i>1) {
          expressions = [
            createDoExpression(expressions)
          ]
        }
      }

      return {
        toString() { return `(${expressions.join(';')})` },
        expressions,
      }
    }
  }, Parser.PREFIX)

  .register('(', {
    precedence: Precedence.CALL,
    parse(parser, token, left) {

      const args = []

      // There may be no arguments at all.
      if (!parser.match(')')) {
        do {
          args.push(parser.parse(0))
        } while (parser.match(','))
        parser.consume(')')
      }

      return {
        toString() { return `${left}(${args.join(',')})` },
        args: [left, ...args],
      }
    }
  }, Parser.XFIX)

  return parser
}