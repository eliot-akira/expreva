import lex from './lex'
import parseTokensToSyntaxTree from './parse'


import { evaluate as evaluateSyntaxTree } from './evaluate'

export const parse = (source: string) => {

  const tokens = lex( source )

  try {

    return parseTokensToSyntaxTree( tokens )

  } catch(e) {
    if (!e.lexer) throw e
    const { start: { line, column } } = e.strpos()
    throw new Error(`Parse error: Token ${e.type} at line ${line} column ${column}`)
  }
}

export function evaluate(source, env) {
  return evaluateSyntaxTree(
    Array.isArray(source) ? source : parse(source),
    env
  )
}

export function toString(nodes) {
  if (!Array.isArray(nodes)) return nodes
  return `(${nodes.map(node => toString(node)).join(' ')})`
}


export { toString as toFormattedString }

export { Token } from './Parser'
export { createEnvironment } from './evaluate'
