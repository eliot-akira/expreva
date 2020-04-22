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

export { registerTokens } from './tokens'

export const rules = [
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
]

export function registerRules(parser) {
  for (const rule of rules) {
    rule(parser)
  }
}
