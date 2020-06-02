import {
  parse as defaultParse,
  defaultParser,
  defaultLexer
} from './parse'
import {
  Expression,
  RuntimeEnvironment,
  evaluate as evaluateSyntaxTree
} from './evaluate'

export { parse, Lexer, Parser } from './parse'
export { createEnvironment } from './evaluate'
export {
  syntaxTreeToString,
  syntaxTreeToPrettyString,
  valueToPrettyString
} from './format'

export { defaultParser as parser }
export { defaultLexer as lexer }

export function evaluate(source: string | Expression[], env: RuntimeEnvironment, parse = defaultParse) {
  return evaluateSyntaxTree(
    typeof source === 'string' ? parse(source) : source,
    env
  )
}
