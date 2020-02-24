import { Lexer } from './lexer'
import { Parser } from './parser'
import {
  evaluate,
  Expression,
  ExpressionResult,
  createEnvironment,
  EnvironmentProps,
  RuntimeEnvironment
} from './evaluate'
import { toString, toFormattedString, valueToExpression } from './compile'
import rules from './rules'

const parser = new Parser(
  new Lexer(rules)
)

export interface Expreva {
  parse: (str: string) => Expression
  evaluate: (ast: Expression, givenEnv?: RuntimeEnvironment) => ExpressionResult
  createEnvironment(props?: EnvironmentProps): RuntimeEnvironment
  toString: (expr: Expression) => string
  toFormattedString: (expr: Expression) => string
  valueToExpression: (value: any) => Expression
}

const expreva = {
  parse: (str: string) => parser.parse(str),
  evaluate: (expr: Expression | string, env?: RuntimeEnvironment): any | never => {
    return evaluate(
      typeof expr==='string' ? parser.parse(expr) : expr,
      env
    )
  },
  createEnvironment,
  toString,
  toFormattedString,
  valueToExpression
}

export default expreva