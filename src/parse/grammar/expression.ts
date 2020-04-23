import { precedence } from './constants'
import { createDoExpression } from './utils'
import { ExpressionParserInterface } from '../Parser'

export default function(parser) {

  parser

  // Expression

  .register('(', {
    parse: parseExpression
  }, parser.PREFIX)

  // Function call

  .register('(', {
    precedence: precedence.CALL,
    parse(parser, token, left) {

      // Function call () must be on same line - treat as separate expression
      if (left.afterNewLine) {
        const right = parseExpression(parser, token)
        parser.stack.push(right)
        return left
      }

      const args = []

      // Can be empty
      if (!parser.match(')')) {
        do {
          args.push(parser.parse(0))
        } while (parser.match(','))
        parser.consume(')')
      }

      return {
        args: [left, ...args],
        toString() { return `${left}(${args.join(',')})` },
      }
    }
  }, parser.XFIX)

  return parser
}

function parseExpression(parser) {

  let expressions = []

  // Can be empty
  if (!parser.match(')')) {

    let i = 0
    do {

      // Expression or argument list
      do {
        expressions.push(parser.parse(0))
      } while (parser.match(','))

      // parser.consume(')') // Previously single expression only

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
    expressions,
    toString() { return `(${expressions.join(';')})` },
  }
}
