import { parse as defaultParse } from './parse'
import { evaluate as evaluateSyntaxTree } from './evaluate'

export { parse, Lexer, Parser } from './parse'
export { createEnvironment } from './evaluate'
export { toString, toFormattedString } from './format'

export function evaluate(source, env, parse = defaultParse) {
  return evaluateSyntaxTree(
    typeof source === 'string' ? parse(source) : source,
    env
  )
}
