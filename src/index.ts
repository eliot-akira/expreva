import { RuleDefinition } from './Rule'
import { Lexer } from './Lexer'
import { Parser } from './Parser'
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

export class Expreva {
  static Parser = Parser
  static Lexer = Lexer

  public parser: Parser

  constructor(customRules?: RuleDefinition[]) {
    this.parser = new Parser(
      new Lexer(customRules || rules)
    )
  }

  parse(str: string): Expression {
    return this.parser.parse(str)
  }

  evaluate(expr: Expression | string, env?: RuntimeEnvironment): ExpressionResult {
    return evaluate(typeof expr==='string' ? this.parse(expr) : expr, env)
  }

  createEnvironment = createEnvironment
  toString = toString
  toFormattedString = toFormattedString
  valueToExpression = valueToExpression
}

const expreva = new Expreva()

export default expreva