import { Parser } from '../Parser'
import { Precedence } from './constants'
import { createDoExpression } from './utils'

export default function(parser) {

  parser

  // Statement

  .infix(';', Precedence.STATEMENT, Parser.RIGHT_ASSOC, (token, left, right) => {

    if (left.value==='do') {

      if (right.value==='do') {
        left.args.push(...right.args)
      } else {
        left.args.push(right)
      }

      return left
    }

    if (right.value==='do') {
      return createDoExpression([left, ...right.args])
    }

    return createDoExpression([left, right])
  })

  // Ignore last ";"
  .postfix(';', Precedence.POSTFIX, (token, left) => left)

  // Expression

  .register('(', {
    parse(parser, token) {

      let expressions = []

console.log('( PRE -->')
      // There may be no arguments at all.
      if (!parser.match(')')) {

        let i = 0
        do {

          // Expression or argument list
          do {
            expressions.push(parser.parse(0))
          } while (parser.match(','))

          // Keep consuming expressions
          i++
        } while (!parser.match(')') && parser.peek(0))

        if (i>1) {
          expressions = [
            createDoExpression(expressions)
          ]
        }

        // parser.consume(')')
      }
console.log('( PRE <--', expressions)

return {
        // value: 'apply', //token.match,
        toString() {
          return `(${expressions.join(';')})`
        },
        expressions,
      }

      // const expr = parser.parse(0)
      // parser.consume(')')

      // return {
      //   // value: token.match,
      //   toString() { return ''+expr },
      //   expressions: [expr]
      // }
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
        // value: 'apply', //token.match,
        toString() {
          return `${left}(${args.join(',')})`
        },
        args: [left, ...args],
      }
    }
  }, Parser.XFIX)

  return parser
}