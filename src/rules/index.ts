import argumentRules from './argument'
import arithmeticRules from './arithmetic'
import listRules from './list'
import commentRules from './comment'
import comparisonRules from './comparison'
import conditionalRules from './conditional'
import expressionRules from './expression'
import functionRules from './function'
import keyValuePairRules from './keyValuePair'
import objectRules from './object'
import spaceRules from './space'
import statementRules from './statement'
import symbolRules from './symbol'

/**
 * Define parse rules for language syntax.
 *
 * - Number
 * - Number prefix `+` and `-`
 * - Symbol for variables
 * - String in double or single quotes, with escape characters
 * - Arithmetic operators: `+`, `-`, `*`, `/`
 * - Assignment: `=`
 * - Comparison: `==`, '!=', `>`, `>=`, `<`, `<=`
 * - Conditions: `if`, `then`, `else`, `condition ? true : false`
 * - Conditional operators: `&&`, `||`, `!`, `and`, `or`, `not`
 * - Group expression with `(` and `)`
 * - Statement separator `;`
 * - Function call with arguments: `f(x,y)`
 * - Function application with arguments: `x->f` and `(x, y)->f`
 * - Anonymous function with arguments: `x => body` and `(x, y) => body`
 * - Array []
 * - Object { key: value }
 * - Array and object member x.y
 *
 * Note that each rule's regular expression must only have a single capture group. The order
 * of rules below determines the order in which they are matched against the source string.
 *
 * ---
 *
 * A token's power ("left-binding power") determines the operator precedence.
 *
 * Power values are based on [Douglas Crockford's article](http://crockford.com/javascript/tdop/tdop.html),
 * with adjustments to support additional operators and syntax.
 *
 *   0   non-binding operators like ;
 *  10   assignment operators like =
 *  20   ?
 *  30   || &&
 *  40   relational operators like ===
 *  50   + -
 *  60   * /
 *  70   unary operators like !
 *  80   . [ (
 */

export default [

  ...spaceRules,
  ...expressionRules,
  ...statementRules,

  ...commentRules,
  ...keyValuePairRules,
  ...functionRules,
  ...listRules,
  ...objectRules,

  ...comparisonRules,
  ...conditionalRules,

  // Simplest regex matches
  ...argumentRules,
  ...arithmeticRules,
  ...symbolRules
]
