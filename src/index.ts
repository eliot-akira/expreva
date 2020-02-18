import { Lexer } from './lexer'
import { Parser } from './parser'
import { evaluate, Expression, EnvironmentProps, Environment, createEnvironment } from './evaluate'
import { toString, toFormattedString } from './compile'
import rules from './rules'

const parser = new Parser(
  new Lexer(rules)
)

const expreva = {
  parse: (str: string) => parser.parse(str),
  evaluate: (expr: Expression | string, env?: Environment): any | never => {
    return evaluate(
      typeof expr==='string' ? parser.parse(expr) : expr,
      env
    )
  },
  createEnvironment,
  toString,
  toFormattedString
}

export default expreva