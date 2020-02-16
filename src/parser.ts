import { Token } from './token'
import { Lexer } from './lexer'
import { Expression, Atom } from './evaluate'

/**
 * Parse a given source string into a syntax tree of expressions.
 *
 * @see https://en.wikipedia.org/wiki/Parsing#Parser
 *
 * Input is first tokenized by the lexer, and then parsed according to prefix and infix
 * functions of the generated tokens.
 */

export class Parser {

  public lexer: Lexer
  public tokens: Token[] = []
  public cursor: number = 0
  public expressions: Expression[] = []

  constructor(lexer?: Lexer) {
    if (lexer) this.lexer = lexer
  }

  current() {
    return this.tokens[ this.cursor ]
  }

  next() {
    this.cursor++
  }

  /**
   * Parse string and return the resulting abstract syntax tree.
   */
  parse(input: string = ''): Expression[] {

    // First pass
    this.tokens = this.lexer.tokenize(input)

    // Second pass
    this.cursor = 0
    this.expressions = []

    do {

      let expr = this.nextExpression()

      if (expr==null) continue
      if (!Array.isArray(expr)) expr = [expr]
      if (!expr.length) continue

      this.expressions.push(expr as Expression)

    } while (this.current())

    const count = this.expressions.length
    if (count===1) {
      // Unwrap expression
      this.expressions = this.expressions[0] as Expression[]
    } else if (count > 1) {
      // Evaluate multiple expressions
      this.expressions = ['do', ...this.expressions] as Expression[]
    }

    // Third pass
    this.expressions = this.handleUnexpandedArguments(this.expressions)

    return this.expressions
  }

  /**
   * Parse and return the next expression.
   *
   * The value of `rightBindingPower` determines how much the expression binds to
   * the right.
   *
   * The `prefix` and `infix` methods of tokens call this function recursively to
   * extract expressions.
   */
  nextExpression(rightBindingPower: number = 0): Atom | void {

    let token = this.current()
    if (!token) return

    this.next()

    let expr = token.prefix(this)
    token = this.current()

    while (token && rightBindingPower < token.power) {

      if (!(token = this.current())) break
      this.next()

      expr = this.expandArguments(
        // Statement separator can leave undefined on left side
        expr==null ? token.prefix(this)
          : token.infix(this, expr)
      )

      token = this.current()
    }

    return expr
  }

  /**
   * Expand arguments list
   */
  expandArguments(expr: Expression | void) {

    if (!expr || !Array.isArray(expr)
      || !expr[1] || !this.isArgumentList(expr[1])
    )  return expr

    if (expr[0]==='lambda') {

      // Argument definition: (lambda, [x, y, z], body)

      ;(expr[1] as []).shift() // Remove keyword
      return expr
    }

    // Function call arguments: f(x, y, z)

    const args = expr.pop()

    if (!Array.isArray(args)) {
      if (args) expr.push(args)
      return expr
    }

    ;(args as []).shift() // Remove keyword
    return expr.concat(args as Expression)
  }

  isArgumentList(expr) {
    return Array.isArray(expr) && expr[0]==='args..'
  }

  /**
   * After all expressions are parsed, scan for unexpanded arguments
   */
  handleUnexpandedArguments(expr) {
    if (!expr || !Array.isArray(expr)) return expr
    if (this.isArgumentList(expr)) {
      expr[0] = 'list'
    }
    for (let i=0, len=expr.length; i < len; i++) {
      if (this.isArgumentList(expr[i])) {
        expr[i][0] = 'list'
      } else {
        expr[i] = this.handleUnexpandedArguments(expr[i])
      }
    }
    return expr
  }
}

/**
 * Parse-time error with data property
 */
export class ParseError extends Error {
  constructor(public message: string, public data?: any) {
    super(message)
  }
}
