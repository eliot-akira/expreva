export function createDoExpression(expressions) {
  return {
    value: 'do',
    toString() { return `(${this.args.join(';')})` },
    args: expressions
  }
}

export function parseExpressionsUntil(parser, endTokenTypes = [',']) {

  let token, expressions = []

  do {
    expressions.push(parser.parse(0))
  } while (
    (token = parser.peek(0))
    && endTokenTypes.indexOf(token.type) < 0
  )

  return expressions[1]==null ? expressions[0]
    : createDoExpression(expressions)
}
