import { Rule, RuleDefinition, RuleAcceptResult } from './rule'
import { Token, EndToken } from './token'
import { ParseError } from './parser'

/**
 * The lexer applies a set of rules to a given string, matches regular expressions
 * and generates token instances.
 *
 * @see https://en.wikipedia.org/wiki/Lexical_analysis
 *
 * The order in which rules are added to is important, as it is the order in which
 * they're are matched against the input.
 *
 * Example:
 *
 * ```php
 * lexer = new Lexer([
 *   [
 *     'name' => 'if',
 *     'match' => '/^if/'
 *   ],
 *   [
 *     'name' => 'identifier',
 *     'match' => '/^([a-zA-Z0-9_]+)/'
 *   ]
 * ])
 *
 * lexer.tokenize('if a')
 * ```
 *
 * If the rules in the example were added in reversed order, the rule for `if` would
 * never apply, since the rule for `identifier` also accepts the string `if`.
 */
export class Lexer {

  public rules: Rule[] = []

  constructor(rules: RuleDefinition[] = []) {
    rules.forEach(rule => {
      this.rules.push(new Rule(rule))
    })
  }

  /**
   * Split `input` into tokens and return the resulting list.
   */
  tokenize(input: string): Token[] {

    const lines = input.split("\n")
    const tokens: Token[] = []

    for (let i=0, len=lines.length; i < len; i++) {

      const lineIndex = i

      let line = lines[i]
      let columnIndex = 0

      while (line.length) {

        let progressed = false

        for (const rule of this.rules) {

          const result = rule.accept(line, lineIndex, columnIndex)
          if (!result) continue

          const { token, length } = result as RuleAcceptResult

          line = line.slice(length)
          columnIndex += length
          tokens.push(token)
          progressed = true
          break
        }

        if (!progressed) {
          throw new ParseError(`Unable to tokenize at line ${lineIndex+1} column ${columnIndex+1}: ${line}`)
        }
      }
    }

    tokens.push(new EndToken)
    return tokens
  }
}
