import lex from './lex'
import parseTokens from './parse'
import util from 'util'

const inspect = obj => util.inspect(obj, false, null, true)

import { evaluate as evaluateTree } from './evaluate'

export const parse = source => {
console.log('LEX', source)
  const tokens = lex( source )
console.log('LEXED', tokens.map(t => t.match).join(' '))
  try {
    const tokenTree = parseTokens( tokens )
    console.log('PARSED', `${tokenTree}`)

    const ast = compile(tokenTree)
    console.log('COMPILED', inspect(ast))

    return ast

  } catch(e) {
    if (!e.lexer) throw e
    const { start: { line, column } } = e.strpos()
    throw new Error(`Parse error: Token ${e.type} at line ${line} column ${column}`)
  }
}

export function evaluate(source) {
  if (Array.isArray(source)) return evaluateTree(source)
  return evaluateTree(parse(source))
}

function compile(ast) {

  if (ast==null) return []
  if (Array.isArray(ast)) return ast.map(compile)

  // Expressions can be reduced to a single expression
  if (ast.expressions!=null) {
    if (!ast.expressions[1]) return compile(ast.expressions[0])
    return ast.expressions.map(compile)
  }

  // Arguments are always an array
  if (ast.args!=null) {
    if (ast.value==null) {
      return ast.args.map(compile)
    }
    return [
      ast.value,
      ...ast.args.map(compile),
    ]
  }

  // Nullary
  if (ast.left==null) {
    if (ast.right!=null) {
      if (ast.value==null) return compile(ast.right)
      return [ast.value, compile(ast.right)]
    }
    return ast.value
  }

  // Prefix
  if (ast.right==null) {
    if (ast.value==null) return compile(ast.left)
    return [
      ast.value,
      compile(ast.left),
    ]
  }

  // Infix
  return [
    ast.value,
    compile(ast.left),
    compile(ast.right)
  ]
}

export function toString(nodes) {
  if (!Array.isArray(nodes)) return nodes
  return `(${nodes.map(node => toString(node)).join(' ')})`
}

export { Token } from './Parser'
