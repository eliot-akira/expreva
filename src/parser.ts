import { Token } from './token'
import { Lexer } from './lexer'
import { Expression } from './evaluate'

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
  public expressions: Expression = []
  public scheduledExpressions: Expression[] = []
  public expressionLevel = 0

  constructor(lexer: Lexer) {
    this.lexer = lexer
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
  parse(input: string = ''): Expression {

    this.tokens = this.lexer.tokenize(input)
    this.cursor = 0
    this.expressions = []
    this.scheduledExpressions = []
    this.expressionLevel = 0

    do {
      const expr = this.parseExpression()
      if (expr==null || (Array.isArray(expr) && !expr.length)) continue

      this.expressions.push(expr as Expression)

    } while (this.current())

    this.expressions.push(...this.scheduledExpressions)
    this.scheduledExpressions = []

    this.expressions =
      this.handleMultipleExpressions(
        this.handleUnexpandedKeywords(this.expressions)
      ) as Expression
    if (this.expressions==null) this.expressions = []

    return this.expressions
  }

  /**
   * Parse and return the next expression.
   *
   * The value of `rightBindingPower` determines how much the expression associates
   * to the right.
   *
   * The `prefix` and `infix` methods of tokens call this function recursively to
   * group expressions.
   */
  parseExpression(rightBindingPower: number = 0): Expression | void {

    let token
    if (!(token = this.current())) {
      if (this.hasScheduled()) return this.nextScheduled()
      return
    }

    let expr
    if (this.hasScheduled()) {
      expr = this.nextScheduled()
    } else {
      this.next()
      expr = token.prefix(this)
    }

    // Next scheduled, possibly from prefix()
    if (this.hasScheduled()) {
      if (expr==null) return
      const next = this.nextScheduled()
      return expr===',' ? next : ['do', expr, next]
    }

    // Gather expression to the right

    token = this.current()

    while (token && rightBindingPower < token.power) {
      this.next()
      expr = this.expandArguments(
        token.infix(this, expr)
      )
      token = this.current()
    }

    return expr
  }

  scheduleExpression(...exprs: Expression[]) {
    this.scheduledExpressions.push(...exprs.filter(e => e!=null))
  }
  hasScheduled() {
    return this.scheduledExpressions.length > 0
  }
  nextScheduled() {
    return this.scheduledExpressions.shift()
  }

  withNextStatements(power: number, expr: Expression) {
    // Gather statements, if any
    let num = 0
    while (this.hasScheduled()) {
      num++
      const next = this.nextScheduled()

      const after = this.parseExpression(power)
      if (after!=null) this.scheduleExpression(after)

      if (next==null)  continue
      if (num > 1) (expr as Expression[]).push(next)
      else if (Array.isArray(expr) && expr[0]==='do') expr.push(next)
      else expr = ['do', expr, next]
    }

    return expr
  }

  /**
   * Functions below support additional syntax, such as:
   *
   * - Statements (x;y)
   * - Function arguments (x,y)
   * - Function application (x,y)->f
   * - Array and object member x.y
   */

  handleMultipleExpressions(expr: Expression | void): Expression | void {
    if (!Array.isArray(expr)) return expr

    const count = expr.length
    if (!count) return expr

    // Unwrap expression
    if (count===1) return expr.shift() as Expression
    // Evaluate multiple expressions
    expr.unshift('do')
    return expr
  }

  /**
   * After all expressions are parsed, scan for unexpanded keywords
   */
  handleUnexpandedKeywords(expr: Expression | void): Expression | void {
    return !Array.isArray(expr)
    ? (expr!==';' && expr!=='objEnd' && expr!=='listEnd' && expr!==',' && expr!==':'
        ? expr
        : undefined // Parser error?
      )
    : expr[0]==='get' && typeof expr[1]==='number' && typeof expr[2]==='number'
      ? expr[1] + parseFloat(`0.${expr[2]}`)
      : expr
          .map(e => this.handleUnexpandedKeywords(e))
          .filter(e => e!=null)
  }

  /**
   * Arguments list
   */

  isArgumentList(expr: Expression) {
    return Array.isArray(expr) && expr[0]==='args..'
  }

  expandArguments(expr: Expression | void) {

    if (!expr || !Array.isArray(expr)
      || !expr[1] || !this.isArgumentList(expr[1])
    )  return expr

    if (expr[0]==='lambda') {
      // Argument definition: (lambda, [x, y, z], body)
      (expr[1] as []).shift() // Remove keyword
      return expr
    }

    const args = expr.pop()
    if (!Array.isArray(args)) {
      if (args) expr.push(args)
      return expr
    }

    // Function call arguments: f(x, y, z)
    ;(args as []).shift() // Remove keyword
    return expr.concat(args as Expression)
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
