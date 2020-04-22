import { parseExpressionsUntil } from './utils'

export default function(parser) {

  parser

  // Object

  .register('{', {
    parse(parser, token) {

      const args = []

      // There may be no arguments at all.
      if (!parser.match('}')) {

        do {

          let key = parseExpressionsUntil(parser, [':', ',', '}']) // Previously: parser.parse(0)

          if (key.expressions) {
            // Preserve key as expression, for example (b): value
            key.args = key.expressions
            delete key.expressions
          }

          const keyValuePair = [
            key
          ]

          if (parser.match(':')) {
            keyValuePair.push(
              parseExpressionsUntil(parser, [',', '}']) // Previously: parser.parse(0)
            )
          }

          args.push(keyValuePair)

        } while (parser.match(','))

        parser.consume('}')
      }

      return {
        value: 'obj',
        args,
        toString() {
          return !args[0] ? '{}'
            : `{\n  ${args.map(([key, value]) =>
              `${key}: ${value}`).join(',\n  ')
            }\n}`
        },
      }
    }
  }, parser.PREFIX)

  return parser
}
