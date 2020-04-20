export function createDoExpression(expressions) {
  return {
    value: 'do',
    toString() { return `(${this.args.join(';')})` },
    args: expressions
  }
}