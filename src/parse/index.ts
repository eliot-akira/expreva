import { Parser } from '../Parser'
import arithmeticRules from './arithmetic'
import assignmentRules from './assignment'
import comparisonRules from './comparison'
import conditionalRules from './conditional'
import expressionRules from './expression'
import functionRules from './function'
import listRules from './list'
import objectRules from './object'
import statementRules from './statement'
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
  statementRules,
  symbolRules
].forEach(rules => rules(parser))

export default function parse(tokens) {

  const exprs = parser.parse(tokens)
  const ast = parseSyntax(
    // Unwrap single expression
    exprs[1]==null ? exprs[0]
      // Wrap multiple expressions
      : createDoExpression(exprs)
  )

  return ast
}

function parseSyntax(ast: any) {

  // Convert to Lisp-style syntax tree for the evaluator

  if (ast==null) return []
  if (Array.isArray(ast)) return ast.map(parseSyntax)

  // Expressions can be reduced to a single expression
  if (ast.expressions!=null) {
    if (!ast.expressions[1]) return parseSyntax(ast.expressions[0])
    return ast.expressions.map(parseSyntax)
  }

  // Arguments are always an array
  if (ast.args!=null) {
    if (ast.value==null) {
      return ast.args.map(parseSyntax)
    }
    return [
      ast.value,
      ...ast.args.map(parseSyntax),
    ]
  }

  // Nullary
  if (ast.left==null) {
    if (ast.right!=null) {
      if (ast.value==null) return parseSyntax(ast.right)
      return [ast.value, parseSyntax(ast.right)]
    }
    return ast.value
  }

  // Prefix
  if (ast.right==null) {
    if (ast.value==null) return parseSyntax(ast.left)
    return [
      ast.value,
      parseSyntax(ast.left),
    ]
  }

  // Infix
  return [
    ast.value,
    parseSyntax(ast.left),
    parseSyntax(ast.right)
  ]
}
