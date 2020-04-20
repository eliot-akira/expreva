import { Parser } from '../Parser'
import { Precedence } from './constants'

export default function(parser) {

  parser

  // List

  .register('[', {
    parse(parser, token) {

      const args = []

      // There may be no arguments at all.
      if (!parser.match(']')) {
        do {
          args.push(parser.parse(0))
        } while (parser.match(','))
        parser.consume(']')
      }

      return {
        value: 'list',
        toString() {
          return `[${args.join(',')}]`
        },
        args,
      }

      // const expr = parser.parse(0)
      // parser.consume(']')
      // return {
      //   value: 'list',
      //   toString() { return ''+expr },
      //   args: [expr]
      // }
    }
  }, Parser.PREFIX)

  // .register('[', {
  //   precedence: Precedence.CALL,
  //   parse(parser, token, left) {

  //     const args = []

  //     // There may be no arguments at all.
  //     if (!parser.match(']')) {
  //       do {
  //         args.push(parser.parse(0))
  //       } while (parser.match(','))
  //       parser.consume(']')
  //     }

  //     return {
  //       value: 'list',
  //       toString() {
  //         return `${left}[${args.join(',')}]`
  //       },
  //       args: [left, ...args],
  //     }
  //   }
  // }, Parser.XFIX)

  return parser
}