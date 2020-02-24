import { Parser, ParseError } from './parser'
import { Expression } from './evaluate'

/**
 * A token defines a lexical unit in the parse tree, such as number or operator.
 *
 * The lexer uses rules to match tokens in the source string, and generate token instances.
 *
 * The parser then calls each token's prefix and infix functions, to generate a syntax tree
 * of instructions.
 *
 * Each token implements either `prefix`, `infix`, or both.
 *
 * The`prefix` method  is used for prefix operators, identifiers and statements, when the token
 * occurs in prefix position. In Pratt's paper, this is called `nud`, or  "null denotation".
 *
 * The `infix` method deals with tokens occurring in infix positions.  In Pratt's parlance, it's
 * `led` or "left denotation".
 *
 * The property `$power` ("left-binding power") determines how tightly the token binds to the left.
 *
 * For example:
 *
 *   a OP1 b OP2 c
 *
 * is interpreted as
 *
 *   (a OP1 b) OP2 c     // high left-binding power
 * or
 *   a OP1 (b OP2 c)     // low left-binding
 *
 * Having `$power` of 0 means the token doesn't bind at all, e.g. statement separators.
 *
 * The left-binding power is compared with a right-binding value, passed when a token's prefix or
 * infix method calls the parser for the next expression.
 */

export class Token {

  public name = '(token)'
  public value = ''
  public power = 0

  public line: number
  public column: number

  constructor(definition = {}) {
    Object.keys(definition).forEach(key => {
      this[key] = definition[key] instanceof Function
        ? definition[key].bind(this)
        : definition[key]
    })
  }

  error(message: string) {
    const { line = '?', column = '?' } = this
    throw new ParseError(`${message} at line ${line} column ${column}`, {
      // For syntax highlight, etc.
      line, column
    })
  }

  /**
   * Prefix position
   */
  prefix(parser: Parser): Expression | void {
    return this.error(`Unhandled prefix "${this.name}"`);
  }

  /**
   * Infix position
   */
  infix(parser: Parser, left: Expression | void): Expression | void {
    return this.error(`Unhandled infix "${this.name}"`);
  }
}

/**
 * A token signalling the end of the input.
 */
export class EndToken extends Token {
  public name = '(end)'
  public power = 0

  prefix() {}
  infix() {}
}
