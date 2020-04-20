import { Parser } from '../Parser'
import arithmeticRules from './arithmetic'
import assignmentRules from './assignment'
import comparisonRules from './comparison'
import conditionalRules from './conditional'
import expressionRules from './expression'
import functionRules from './function'
import listRules from './list'
import objectRules from './object'
import symbolRules from './symbol'

import { createDoExpression } from './utils'

const parser = new Parser()

;[
  arithmeticRules,
  assignmentRules,
  comparisonRules,
  conditionalRules,
  expressionRules,
  functionRules,
  listRules,
  objectRules,
  symbolRules
].forEach(rules => rules(parser))

export default function parse(tokens) {

  let expressions = parser.parse(tokens)

  // Unwrap single expression
  if (expressions[1]==null) {
    return expressions[0]
  }

  // Wrap multiple expressions

  const exprs = []

  for (const expr of expressions) {
    exprs.push(expr)
  }
  expressions = createDoExpression(exprs)

  return expressions
}
