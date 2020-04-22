import { parseExpressionsUntil } from './utils'

export default function(parser) {

  parser

  // List

  .register('[', {
    parse(parser, token) {

      const args = []

      // There may be no arguments at all.
      if (!parser.match(']')) {

          do {

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
