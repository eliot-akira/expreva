import { Token } from './Token'
import { TokenType } from './TokenType'
import { Lexer } from './Lexer'
import { Expression } from './evaluate'
import expressionRules from './rules/expression'
import argumentRules from './rules/argument'
import statementRules from './rules/statement'

function createOpenExpression() {
  return new Token({ ...expressionRules[0], value: '(' })
}

function createCloseExpression() {
  return new Token({ ...expressionRules[1], value: ')' })
}

function createEndStatement() {
  return new Token({ ...statementRules[0], value: ';' })
}

function createArgumentSeparator() {
  return new Token({ ...argumentRules[0], value: ',' })
}

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

    this.cursor = 0

    this.tokens = this.lexer.tokenize(input)
    this.tokens = this.organizeTokens()

    this.cursor = 0
    this.expressions = []
    this.scheduledExpressions = []
    this.expressionLevel = 0

    let expressionsCount = 0

    do {
      const expr = this.parseExpression()
      if (expr==null || (Array.isArray(expr) && !expr.length)) continue

      expressionsCount++
      this.expressions.push(expr as Expression)
console.log('--')
    } while (this.current())

console.log('--', this.expressions)

    // If multiple expressions, wrap as single "do"

    if (!expressionsCount) return this.expressions
    if (expressionsCount===1) return this.expressions[0]

    this.expressions.unshift('do')
    return this.expressions

    // this.expressions.push(...this.scheduledExpressions)
    // this.scheduledExpressions = []

    // this.expressions =
    //   this.handleMultipleExpressions(
    //     this.handleUnexpandedKeywords(this.expressions)
    //   ) as Expression

    // if (this.expressions==null) this.expressions = []

    return this.expressions
  }

  organizeTokens(closingTokenType = TokenType.undefined, separatorTokenType = TokenType.commaSeparator): Token[] {

    let tokens: Token[] = []
    let tokenGroups = undefined
    let scheduledCloseToken

    // console.log('organizeTokens --')

    while (!scheduledCloseToken && this.tokens[ this.cursor ]) {

      const token = this.tokens[ this.cursor ]

      switch (token.type) {
      case TokenType.undefined:
      case TokenType.space:
            // Skip token
        break

      case separatorTokenType:
        if (!tokenGroups) {
          tokenGroups = [ tokens ]
        } else {
          tokenGroups.push( tokens )
        }
        tokens = []
      break

      case closingTokenType:
        scheduledCloseToken = token
      break

      case TokenType.openList:

        tokens.push(token)
        this.cursor++
        console.log('Start list --')
        tokens.push(
          ...this.organizeTokens(TokenType.closeList)
        )
        console.log('End list --')

        continue

      break
      case TokenType.newLine:

        // console.log('new line')

        // Insert end statement unless..

        break
      default:
        // console.log(token)
        tokens.push(token)
      }

      this.cursor++
    }

    if (tokenGroups) {
      // Remaining item
      if (tokens.length) tokenGroups.push(tokens)
      tokens = []
      if (tokenGroups.length===1) {
        tokens.push(...tokenGroups[0])
      } else {
        // Wrap in expression
        let i = 0
        for (const tokenGroup of tokenGroups) {
          // if (i > 0) tokens.push(createArgumentSeparator())
          tokens.push(
            createOpenExpression(),
            ...tokenGroup,
            createCloseExpression()
          )
          i++
        }
      }
    }

    if (scheduledCloseToken) tokens.push(scheduledCloseToken)

    console.log('Organized --')
    console.log(tokens.map(t=>t.value).join(' '))
    // tokens.forEach(t=>console.log(t.type, `"${t.value}"`))
    // console.log('--')

    return tokens
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

    let token, expr

/*    if (!(token = this.current())) {
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
*/

    // Gather expression to the right

    if ( ! (token = this.current()) ) return
// console.log('token current', token)

    this.next()

    expr = token.prefix(this)
    token = this.current()

    // console.log('expr~', expr)
    // console.log('token~', token)

    while (token && rightBindingPower < token.power) {
      this.next()
      expr = token.infix(this, expr) // this.expandArguments( token.infix(this, expr) )

      token = this.current()

      // console.log('~expr~', expr)
      // console.log('token', token)
    }

    // console.log('~expr', expr)
    return expr
  }


  // TODO: Refactor below to semantic token processing step

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
      : expr[0]==='args..'
        ? ['list', ...expr.slice(1)]
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
