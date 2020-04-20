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
    }
  }, Parser.PREFIX)

  return parser
}