import { Parser } from '../Parser'
import { Expression } from '../evaluate'

export default [

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
      const right = parser.parseExpression(0) // Was 65, stronger than `->`, weaker than `=>`

      let args: Expression = ['args..']

      if (parser.isArgumentList(left)) {
        args = left as Expression[]
      } else if (left!=null) {
        args.push(left)
      }
      if (right!=null) {
        if (parser.isArgumentList(right)) {
          args.push(...(right as []).slice(1))
        } else {
          args.push(right)
        }
      }
      return args
    }
  },

  // Function application: x->y === y(x)
  {
    match: /^\s*(->)\s*/, // Must come before `-` or `>`
    name: '->',
    power: 60, // Weaker than `=>`
    prefix(parser: Parser) {
    },
    infix(parser: Parser, left: Expression) {
      const right = parser.parseExpression(this.power)
      if (right==null) return left // No target function for apply
      if (left==null) return ['->', right]
      if (Array.isArray(left) && left[0]==='->') {
        parser.pushNextExpression(left)
        return ['->', right]
      }
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
]