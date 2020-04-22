import { precedence } from './constants'

export default function(parser) {

  // Member

  parser

  .infix('.', precedence.EXPONENT, parser.RIGHT_ASSOCIATIVE, (token, left, right) => {

    if (left.value!=null && typeof left.value==='number') {

      // Number with decimal separator

      const fraction = parseFloat(`0.${right.value}`)
      return {
        value: left.value >= 0
          ? left.value + fraction
          : left.value - fraction
        ,
        toString() { return `${left.value}.${right.value}` },
      }
    }

    // Member of list or object
    return {
      value: 'get',
      left,
      right: right.value!=null
        // Literal value
        ? {
          value: ['expr', right.value],
          toString() { return `(expr ${this.value})` },
        }
        : right
      ,
      toString() { return `(${left}.${right})` },
    }
  })

  return parser
}