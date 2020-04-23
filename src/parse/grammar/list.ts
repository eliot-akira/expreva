import { parseExpressionsUntil } from './utils'

export default function(parser) {

  parser

  // List

  .register('[', {
    parse(parser, token) {

      const args = []

      // Can be empty
      if (!parser.match(']')) {

        do {

          // Support trailing comma
          const next =  parser.peek(0)
          if (!next || next.type===']') break

          // Each argument can be one or more expressions
          args.push(
            parseExpressionsUntil(parser, [',', ']'])
          )

        } while (parser.match(','))

        parser.consume(']')
      }

      return {
        value: 'list',
        args,
        toString() { return `[${args.join(',')}]` },
      }
    }
  }, parser.PREFIX)

  return parser
}
