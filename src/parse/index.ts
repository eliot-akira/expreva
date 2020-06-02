import { Lexer } from './Lexer'
import { Parser } from './Parser'
import { registerTokens, registerRules } from './grammar'
import { createDoExpression } from './grammar/utils'

export { Lexer, Parser }

export const defaultLexer = new Lexer()
export const defaultParser = new Parser()

registerTokens( defaultLexer )
registerRules( defaultParser )

export function parse( source: string, lexer: Lexer<any> = defaultLexer, parser = defaultParser ) {

  lexer.source = source

  let exprs
  try {

    exprs = parser.parse( lexer )

    if (!exprs) return exprs

    const ast = parseSyntax(
      exprs[1]==null
        ? exprs[0] // Unwrap single expression
        : createDoExpression(exprs) // Wrap multiple expressions
    )

    return ast

  } catch(e) {
    let token
    if (!e.lexer) {
      token = parser.peek(0) // Last known token
    } else {
      // Parser can throw a token
      token = e
    }

    if (!token) {
      const { line, column } = lexer.strpos(lexer.position)
      throw new Error(`Parse error: ${e.message} at line ${line} column ${column}`)
    }

    const { start: { line, column } } = token.strpos()
    throw new Error(`Parse error: ${e.message || `Token ${token.type}`} at line ${line} column ${column}`)
  }
}

function parseSyntax(ast: any): any | any[] | void {

  // Create compact Lisp-style syntax tree for the evaluator

  if (ast==null) return
  if (Array.isArray(ast)) return parseSyntaxArray(ast)

  // Expressions can be reduced to a single expression
  if (ast.expressions != null) {
    if (!ast.expressions[1]) {
      return parseSyntax(ast.expressions[0])
    }
    return parseSyntaxArray(ast.expressions)
  }

  // Arguments are always an array
  if (ast.args != null) {
    if (ast.value == null) {
      return parseSyntaxArray(ast.args)
    }
    const arr = parseSyntaxArray(ast.args)
    arr.unshift( ast.value )
    return arr
  }

  // Restore number with decimal separator from member expression
  if (ast.value==='get' && ast.left && typeof ast.left.value==='number') {

    if (ast.right==null || typeof ast.right.value!=='number') {
      throw new Error('Invalid number after decimal separator "."')
    }

    const numberString = `${ast.left.value}.${ast.right.value}`

    return parseFloat(numberString)
  }

  const node = ast.value != null
    ? [ast.value]
    : []

  if (ast.left != null) {
    node.push(parseSyntax(ast.left))
  }

  if (ast.right != null) {
    node.push(parseSyntax(ast.right))
  }

  if (node[0] == null) return
  if (node[1] == null) return node[0]

  return node
}

function parseSyntaxArray(nodes: any[]) {
  return nodes.map(parseSyntax).filter(n => n!=null)
}
