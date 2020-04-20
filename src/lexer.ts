import { Rule, RuleDefinition, RuleAcceptResult } from './Rule'
import { Token, EndToken } from './Token'
import { ParseError } from './Parser'

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

    const tokens: Token[] = []
    let line = input, lineIndex = 0, columnIndex = 0

    while (line.length) {

      let progressed = false

      for (const rule of this.rules) {

        const result = rule.accept(line, lineIndex, columnIndex)
        if (!result) continue

        const { token, length } = result as RuleAcceptResult

        if (!length) continue // In case token match is empty

        // Calculate line and column

        const removedLines = line.slice(0, length).split('\n')
        const lastLine = removedLines.pop()
        lineIndex += removedLines.length
        if (removedLines.length) {
          columnIndex = lastLine ? lastLine.length : 0
        } else {
          columnIndex += length
        }

        tokens.push(token)

        line = line.slice(length)
        progressed = true
        break
      }

      if (!progressed && (line = line.trim())) {
        throw new ParseError(`Unable to tokenize at line ${lineIndex+1} column ${columnIndex+1}: ${line}`)
      }
    }

    // tokens.push(new EndToken)
    return tokens
  }
}
