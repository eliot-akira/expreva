import { precedence } from './constants'

function literalStringOrExpression(node) {
  return node && typeof node.value==='string'
    ? {
      value: ['expr', node.value],
      toString() { return `(expr ${node.value})` }
    }
    : node
}

export default function(parser) {

  parser

  // Spread
  .register('...', {
    parse(parser) {
      const right = parser.parse(0)
      return {
        value: '...',
        right,
        toString() { return `...${right}` },
      }
    }
  }, parser.PREFIX)

  // Member
  .register('.', {
    precedence: precedence.CALL,
    parse(parser, token, left) {

      let right = parser.parse(this.precedence)

      if (typeof left.value!=='number') {

        // Nested get members - For example, obj.x.y.z becomes (get (get (get obj x) y) z)

        while (right!=null && right.value==='get') {
          left = {
            value: 'get',
            left,
            right: literalStringOrExpression(right.left),
            toString() { return `(get ${left} ${right.left})` },
          }
          right = right.right
        }
      }

      return {
        value: 'get',
        left,
        right: literalStringOrExpression(right),
        toString() { return `(get ${left} ${right})` },
      }
    }
  }, parser.XFIX)

  return parser
}