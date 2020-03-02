import { Token } from './token'

/**
 * A rule represents an instruction for the lexer.
 *
 * Rules can `accept` input strings and produce a `token` if an input has been accepted.
 *
 * The accepted inputs for a rule are defined by the regular expression `match`, which should
 * include exactly one capturing group.  The value captured by this group is used as the value
 * for the token.  If nothing is captured, the value will be null.
 */

export type RuleDefinition = {
  name: string
  match: RegExp
}

export type RuleAcceptResult = {
  token: Token,
  length: number
}

export class Rule {
  public name: string = '(rule)'
  public definition: RuleDefinition

  // Regular expression to match a token
  public match: RegExp;

  constructor(definition: RuleDefinition) {
    this.name = definition.name
    this.match = definition.match
    this.definition = definition
    return this
  }

  /**
   * Try matching the rule at the beginning of `string`.  A token instance is created from
   * the matched string and returned.  Also returns the length of the match, which is used by
   * the parser to remove the matched text.
   */
  accept(str: string, lineIndex: number = 0, columnIndex: number = 0): RuleAcceptResult | void {

    /**
     * Capture regular expression match and its offset
     * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec
     */
    const matches = this.match.exec(str)

    if (matches===null) return

    const value = matches[0].trim()
    const offset = matches.index
    const length = offset + matches[0].length

    const tokenDefinition = Object.assign({}, this.definition, {
      value,
      line: lineIndex + 1,
      column: columnIndex + offset + 1
    })

    const token = new Token(tokenDefinition)

    return {
      token, length
    }
  }
}
