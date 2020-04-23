import { parseExpressionsUntil } from './utils'

export default function(parser) {

  parser

  // Object

  .register('{', {
    parse(parser, token) {

      const args = []

      // Can be empty
      if (!parser.match('}')) {

        do {

          // Support trailing comma
          const next =  parser.peek(0)
          if (!next || next.type==='}') break

          let key = parseExpressionsUntil(parser, [':', ',', '}'])

          if (key.expressions) {
            // Preserve key as expression, for example (b): value
            key.args = key.expressions
            delete key.expressions
          }

          const keyValuePair = [ key ]

          if (parser.match(':')) {
            keyValuePair.push(
              parseExpressionsUntil(parser, [',', '}'])
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
