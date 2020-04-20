import { Parser } from '../Parser'
import { Precedence } from './constants'

export default function(parser) {

  parser

  // Object

  .register('{', {
    parse(parser, token) {

      const args = []

      // There may be no arguments at all.
      if (!parser.match('}')) {
        do {

          const keyValuePair = [parser.parse(0)]
          if (parser.match(':')) {
            keyValuePair.push(parser.parse(0))
          }

          args.push(keyValuePair)

        } while (parser.match(','))
        parser.consume('}')
      }

      return {
        value: 'obj',
        toString() {
          return !args[0] ? '{}' : `{\n  ${args.map(([key, value]) => `${key}: ${value}`).join(',\n  ')}\n}`
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

  return parser
}