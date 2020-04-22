import { parse as defaultParse } from './parse'
import { evaluate as evaluateSyntaxTree } from './evaluate'

export { parse, Lexer, Parser } from './parse'
export { createEnvironment } from './evaluate'

export function evaluate(source, env, parse = defaultParse) {
  return evaluateSyntaxTree(
    typeof source === 'string' ? parse(source) : source,
    env
  )
}

export function toString(nodes) {
  if (nodes==null) return 'nil'
  if (!Array.isArray(nodes)) return nodes
  return `(${nodes.map(node => toString(node)).join(' ')})`
}

export { toString as toFormattedString }
