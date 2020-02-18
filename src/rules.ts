import { Parser } from './Parser'
import { Expression } from './evaluate'

/**
 * Define parse rules for language syntax.
 *
 * - Number
 * - Number prefix `+` and `-`
 * - Symbol for variables
 * - String wrapped in double or single quotes, and escape characters
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

/** Quote string, otherwise pass through */
const quoteString = (v: Expression) => typeof v==='string' ? ['`', v] : v

export default [

  {
    match: /^\s*(\.)\s*/,
    name: 'member',
    power: 80,
    prefix(parser: Parser) {
      const right = parser.parseExpression(0)
      return right==null ? right : parseFloat(`0.${right}`)
    },
    infix(parser: Parser, left) {
      let right = parser.parseExpression(this.power)
      if (right==null) return left
      if (Array.isArray(right) && right[0]==='get') {
        return ['get', left, quoteString(right[1]), ...right.slice(2)]
      }
      return ['get', left, quoteString(right)]
    }
  },

  {
    match: /^\s*(\d+)\s*/, // (\d+)?\.?
    name: 'number',
    power: 0,
    prefix(parser: Parser) {
      return parseFloat(this.value)
    },
    infix(parser: Parser, left) {},
  },

  // Reserved words must come before symbol

  {
    match: /^\s*(if)\s*/,
    name: 'if',
    power: 20,
    prefix(parser: Parser) {
      const condition = parser.parseExpression(this.power)

      let trueBranch = parser.parseExpression(this.power)
      if (trueBranch==='then') trueBranch = parser.parseExpression(this.power)

      let falseBranch = parser.parseExpression(this.power)
      if (falseBranch==='else') falseBranch = parser.parseExpression(this.power)

      return ['if', condition, trueBranch, falseBranch]
    },
    infix(parser: Parser, left: Expression) {
      return left
    },
  },
  {
    match: /^\s*(or)\s*/,
    name: 'or',
    power: 30,
    prefix() {},
    infix(parser: Parser, left: Expression) {
      const right = parser.parseExpression(this.power)
      return ['||', left, right]
    },
  },
  {
    match: /^\s*(and)\s*/,
    name: 'and',
    power: 30,
    prefix() {},
    infix(parser: Parser, left: Expression) {
      const right = parser.parseExpression(this.power)
      return ['&&', left, right]
    },
  },
  {
    match: /^\s*(not)\s*/,
    name: 'not',
    power: 70,
    prefix(parser: Parser) {
      return ['!', parser.parseExpression(0)]
    },
    infix() {},
  },

  {
    match: /^\s*([a-zA-Z0-9_]+)\s*/,
    name: 'symbol',
    power: 0,
    prefix(parser: Parser) {
      return this.value.trim()
    },
    infix(parser: Parser, left) {},
  },

  /**
   * Match quoted strings with escaped characters
   *
   * @see https://stackoverflow.com/questions/249791/regex-for-quoted-string-with-escaping-quotes#answer-10786066
   */
  {
    match: /^\s*\'([^\'\\]*(\\.[^\'\\]*)*)\'/,
    name: 'single-quoted string',
    power: 0,
    prefix(parser: Parser) {
      // Unwrap quotes and unescape
      return ['`', JSON.parse(`"${this.value.slice(1, -1)}"`)]
    }
  },
  {
    match: /^\s*"([^"\\]*(\\.[^"\\]*)*)"/,
    name: 'double-quoted string',
    power: 0,
    prefix(parser: Parser) {
      // Unwrap quotes and unescape
      return ['`', JSON.parse(this.value)]
    }
  },

  {
    match: /^\s*(\(\s*\))\s*/,
    name: 'empty list',
    power: 80,
    prefix(parser) {},
    infix(parser: Parser, left: Expression[]) {
      return left!=null ? [left] : ['list']
    },
  },
  {
    match: /^\s*(\()\s*/,
    name: 'open expression',
    power: 80,
    prefix(parser: Parser) {
      const expr = parser.parseExpression(0)
      // Parse to right parenthesis
      parser.parseExpression(this.power)
      // Include expressions pushed by end statement
      return parser.handleNextExpressions(expr as Expression)
    },
    infix(parser: Parser, left: Expression) {
      const right = parser.parseExpression(0)
      // Parse to right parenthesis
      parser.parseExpression(this.power)
      if (left==null) return right
      return [left, right]
    },
  },
  {
    match: /^\s*;*\s*(\))\s*/, // ), ;)
    name: 'close expression',
    power: 0,
    prefix() {},
    infix(parser: Parser, left: Expression[]) {},
  },

  {
    match: /^\s*(;+)\s*/,
    name: 'end statement',
    power: 0,
    prefix(parser: Parser) {
      const left = parser.parseExpression(0)
      if (left!=null) parser.pushNextExpression(left)
    },
    infix() {},
  },


  // Function
  {
    match: /^\s*(\,)\s*/,
    name: 'argument separator',
    power: 5, // Stronger than )
    prefix() {},
    infix(parser: Parser, left: Expression) {

      // Inside object definition
      if (Array.isArray(left) && left[0]==='pair') return left

      // Add right side to argument list
      const right = parser.parseExpression(65) // Stronger than `->`, weaker than `=>`
      let args: Expression = ['args..']

      if (parser.isArgumentList(left)) {
        args = left as Expression[]
      } else if (left!=null) {
        args.push(left)
      }
      if (right!=null) args.push(right)
      return args
    }
  },
  // Function application: x->y === y(x)
  {
    match: /^\s*(->)\s*/, // Must come before `-` or `>`
    name: '->',
    power: 60, // Weaker than `=>`
    prefix(parser: Parser) {},
    infix(parser: Parser, left: Expression) {
      const right = parser.parseExpression(this.power)
      if (right==null) return left // No target function for apply
      if (left==null) return right
      return [right, left]
    },
  },
  // Function definition: ()=>, x=>, (x)=>, (x, y)=>
  {
    match: /^\s*(=>)\s*/, // Must come before `=` or `>`
    name: 'lambda',
    power: 70,
    prefix(parser: Parser) {},
    infix(parser: Parser, left: Expression) {
      if (left==null) left = []
      else if (!parser.isArgumentList(left)) {
        left = ['args..', left]
      }
      const right = parser.parseExpression(0)
      return ['lambda', left, right]
    },
  },

  // Conditional

  {
    match: /^\s*(\?)\s*/,
    name: '?',
    power: 20,
    prefix() {},
    infix(parser: Parser, left: Expression) {
      const trueBranch = parser.parseExpression(this.power)
      const falseBranch = parser.parseExpression(this.power)
      return ['if', left, trueBranch, falseBranch]
    },
  },
  {
    match: /^\s*(:)\s*/,
    name: ':',
    power: 20,
    prefix(parser: Parser) {
      return parser.parseExpression(0)
    },
    infix(parser: Parser, left: Expression) {
      const right = parser.parseExpression(this.power)

      // Key-value pair for object definition
      if (!Array.isArray(left) || left[0]!=='if') {
        return ['pair', left, right]
      }

      if (right) left.push(right)
      return left
    },
  },

  // Array
  {
    match: /^\s*(\[)\s*/,
    name: 'open array',
    power: 80,
    prefix(parser: Parser) {
      const expr = parser.parseExpression(0)
      // Parse to right bracket
      parser.parseExpression(this.power)
      if (Array.isArray(expr) && expr[0]==='args..') {
        expr[0] = 'list'
        return expr
      }
      if (expr==null) return ['list']
      return ['list', expr]
    },
    infix(parser: Parser, left: Expression) {},
  },
  {
    match: /^\s*(\])\s*/,
    name: 'close array',
    power: 0,
    prefix() {},
    infix(parser: Parser, left: Expression[]) {},
  },

  {
    match: /^\s*(\{)\s*/,
    name: 'open object',
    power: 80,
    prefix(parser: Parser) {
      const expr = parser.parseExpression(0)
      // Gather key-value pairs
      const allPairs = expr==null ? [] : [expr]
      let next
      while (next = parser.parseExpression(0)) {
        if (!next || next[0]!=='pair') break
        allPairs.push(next)
      }
      if (next!=null) parser.pushNextExpression(next)
      return ['obj', ...allPairs.map(a => {
        (a as []).shift() // Remove keyword "pair"
        return a
      })]
    },
    infix(parser: Parser, left: Expression) {},
  },
  {
    match: /^\s*(\})\s*/,
    name: 'close object',
    power: 0,
    prefix() {},
    infix() {},
  },

  {
    match: /^\s*(\|\|)\s*/,
    name: '||',
    power: 30,
    prefix() {},
    infix(parser: Parser, left: Expression) {
      const right = parser.parseExpression(this.power)
      return ['||', left, right]
    },
  },
  {
    match: /^\s*(&&)\s*/,
    name: '&&',
    power: 30,
    prefix() {},
    infix(parser: Parser, left: Expression) {
      const right = parser.parseExpression(this.power)
      return ['&&', left, right]
    },
  },

  // Comparison
  {
    match: /^\s*(==)\s*/, // Must come before `=`
    name: '==',
    power: 40,
    prefix() {},
    infix(parser: Parser, left: Expression) {
      const right = parser.parseExpression(this.power)
      return ['==', left, right]
    },
  },
  {
    match: /^\s*(\!=)\s*/,
    name: '!=',
    power: 40,
    prefix() {},
    infix(parser: Parser, left: Expression) {
      const right = parser.parseExpression(this.power)
      return ['!=', left, right]
    },
  },

  {
    match: /^\s*(\!)\s*/,
    name: '!',
    power: 70,
    prefix(parser: Parser) {
      return ['!', parser.parseExpression(0)]
    },
    infix() {},
  },

  {
    match: /^\s*(<=)\s*/,
    name: '<=',
    power: 40,
    prefix() {},
    infix(parser: Parser, left: Expression) {
      const right = parser.parseExpression(this.power)
      return ['<=', left, right]
    },
  },
  {
    match: /^\s*(<)\s*/,
    name: '<',
    power: 40,
    prefix() {},
    infix(parser: Parser, left: Expression) {
      const right = parser.parseExpression(this.power)
      return ['<', left, right]
    },
  },
  {
    match: /^\s*(>=)\s*/,
    name: '>=',
    power: 40,
    prefix() {},
    infix(parser: Parser, left: Expression) {
      const right = parser.parseExpression(this.power)
      return ['>=', left, right]
    },
  },
  {
    match: /^\s*(>)\s*/,
    name: '>',
    power: 40,
    prefix() {},
    infix(parser: Parser, left: Expression) {
      const right = parser.parseExpression(this.power)
      return ['>', left, right]
    },
  },

  {
    match: /^\s*(=)\s*/,
    name: 'def',
    power: 10,
    prefix() {},
    infix(parser: Parser, left: Expression) {
      const right = parser.parseExpression(this.power)
      return ['def', left, right]
    },
  },

  {
    match: /^\s*([+])\s*/,
    name: '+',
    power: 50,
    prefix(parser: Parser) {
      /**
       * Positive sign binds stronger than / or *
       */
      return parser.parseExpression(70)
    },
    infix(parser: Parser, left: Expression) {
      const right = parser.parseExpression(this.power)
      return ['+', left, right]
    },
  },
  {
    match: /^\s*(-)\s*/,
    name: '-',
    power: 50,
    prefix(parser: Parser) {
      /**
       * Negative sign binds stronger than / or *
       */
      return -parser.parseExpression(70)
    },
    infix(parser: Parser, left: Expression) {
      const right = parser.parseExpression(this.power)
      return ['-', left, right]
    },
  },
  {
    match: /^\s*(\*)\s*/,
    name: '*',
    power: 60,
    infix(parser: Parser, left: Expression) {
      const right = parser.parseExpression(this.power)
      return ['*', left, right]
    },
  },
  {
    match: /^\s*(\/)\s*/,
    name: '/',
    power: 60,
    infix(parser: Parser, left: Expression) {
      const right = parser.parseExpression(this.power)
      return ['/', left, right]
    },
  },

]
