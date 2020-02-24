import { Parser } from '../Parser'
import { Expression } from '../evaluate'

export default [

  // Function application: x->y === y(x)
  {
    match: /^\s*(->)\s*/, // Must come before `-` or `>`
    name: '->',
    power: 60, // Weaker than `=>`
    prefix(parser: Parser) {
    },
    infix(parser: Parser, left: Expression) {

      const expr = []

      if (left!=null) expr.push(left)

      // Target function
      const right = parser.parseExpression(this.power)
      if (right!=null) expr.unshift(right)

      return expr
    },
  },

  // Function definition: ()=>, x=>, (x)=>, (x, y)=>
  {
    match: /^\s*(=>)\s*/, // Must come before `=` or `>`
    name: 'lambda',
    power: 70,
    prefix(parser: Parser) {},
    infix(parser: Parser, left: Expression) {
      // Argument definition
      if (left==null) left = []
      else if (!parser.isArgumentList(left)) {

        if (Array.isArray(left)) {
          // Unwrap single argument as expression (x)
          if (left[0]==='do') left.shift()
          // Unwrap multiple arguments as list
          else if (left.length===1 && Array.isArray(left[0]) && left[0][0]!=='list') {
            left = left[0]
          }
          left = ['args..', ...left]
        } else left = ['args..', left]
      }

      left = left.filter(e => e!==',')

      // Function body
      const right = parser.parseExpression(0)
      return ['lambda', left, right]
    },
  },
]