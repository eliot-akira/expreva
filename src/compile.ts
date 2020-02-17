import { Expression, Atom } from './evaluate'

export const toString = (
  expr: Expression,
  inner: boolean = false
): string =>
  !Array.isArray(expr)
    ? (inner ? expr : expr)
    : `(${
      expr.map(e => toString(e as Expression, true)).join(' ')
    })`

export const toFormattedString = (
  expr: Expression,
  internalProps?: { [key: string]: any }
): string => {
  const {
    indent = 0,
    childIndent = indent,
    inner = false
  } = internalProps || {}

  const spaces = ' '.repeat(indent)

  return !Array.isArray(expr)
    ? (inner ? `${' '.repeat(childIndent)}${expr}` : expr)
    : typeof expr[0]!=='string'
      ? `${spaces}(${
            expr.map(e => toFormattedString(e, {
              indent: !Array.isArray(e) ? indent+1 : indent,
              childIndent: childIndent+1,
              inner: true
            })).join('\n')
          })`
      : `${spaces}(${expr[0]==='lambda' ? 'λ' : expr[0]}${
        expr[1]==null
          ? ''
          : (expr[0]==='lambda'
              // Argument list
              ? ' ('+(expr[1] as []).join(' ')+')'
              // First argument on same line as function name
              : !Array.isArray(expr[1]) ? ' '+expr[1] : (' '
                +toFormattedString(expr[1], {
                  indent: 0,
                  childIndent: childIndent+( (expr[0]+'').length )+2,
                  // inner: true
                }))
            )+(expr[2]==null ? ''
              : "\n"+(
                expr.slice(2).map(e => toFormattedString(e, {
                  indent: childIndent+( expr[0]==='lambda' ? 1 : (expr[0]+'').length )+2, // "("+name+space+"("
                  inner: true
                })).join('\n')))
      })`
}
