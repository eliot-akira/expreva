import { Expression, Atom } from './evaluate'

export const toString = (
  expr: Expression,
  inner: boolean = false
): string =>
  !Array.isArray(expr)
    ? (inner ? expr : '')
    : expr.length===1 && !Array.isArray(expr[0]) ? expr[0]+'' : `(${
      expr.map(e => toString(e as Expression, true)).join(' ')
    })`

export const toFormattedString = (
  expr: Expression,
  indentNum: number = 0,
  inner: boolean = false
): string => {
  const indent = ' '.repeat(indentNum)
  return !Array.isArray(expr)
    ? (inner ? `${indent}${expr}` : '')
      : expr && expr[1] && typeof expr[0]==='string'
        ? `${indent}(${expr[0]}\n${
          // toFormattedString(expr.slice(1), indentNum + 1, true)
          expr.slice(1).map(e => toFormattedString(e, indentNum+1, true)).join('\n')
        })`
        : `${
          expr.map(e => toFormattedString(e, indentNum, true)).join('\n')
        }`
}
