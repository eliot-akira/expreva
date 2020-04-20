import { Parser } from '../Parser'
import { Expression } from '../evaluate'
import { TokenType } from '../TokenType'

export default [

  // Function application: x->y === y(x)
  {
    match: /^(->)/, // Must come before `-` or `>`
    type: TokenType.apply,
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
    match: /^(=>)/, // Must come before `=` or `>`
    type: TokenType.lambda,
    power: 90, // Stronger than ()
    prefix(parser: Parser) {
      const right = parser.parseExpression(0)
console.log('=> pre', right)
      return ['lambda', [], right]
    },
    infix(parser: Parser, left: Expression) {
console.log('=> in', left)

      // // Argument definition
      // if (left==null) left = []
      // else if (!parser.isArgumentList(left)) {
      //   if (Array.isArray(left)) {
      //     // Unwrap zero or single argument as expression (), (x)
      //     if (left[0]==='do' || left[0]==='list') left.shift()
      //     // Unwrap multiple arguments as list
      //     else if (left.length===1 && Array.isArray(left[0]) && left[0][0]!=='list') {
      //       left = left[0]
      //     }
      //     left = ['args..', ...left]
      //   } else left = ['args..', left]
      // }

      // left = left.filter(e => e!==',')

      if (left===null) left = []
      else if (!Array.isArray(left) || left[0]!=='list') {
        left = [left]
      }

      // Function body
      const right = parser.parseExpression(0)
      return ['lambda', left, right]
    },
  },
]