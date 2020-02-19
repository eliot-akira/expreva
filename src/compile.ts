import { Expression } from './evaluate'

export const toString = (
  expr: Expression,
  inner: boolean = false
): string =>
  !Array.isArray(expr)
    ? typeof expr==='object'
      ? toString(['obj', Object.keys(expr).map(key => ['pair', key, expr[key]])])
      : expr==null ? '' : (inner ? expr : expr)+''
    : `(${
      expr.map(e => e==='lambda' ? 'λ' : toString(e as Expression, true)).join(' ')
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

  return expr instanceof Function
    ? (expr.lambda ? expr.toString() : expr.name ? expr.name : '(native function)')
    // Object or primitive value
    : !Array.isArray(expr)
      ? typeof expr==='object'
        ? toFormattedString(['obj', ...Object.keys(expr).map(key => [key, expr[key]])], {
          indent
          // inner: true
        })
        : expr==null ? '' : (inner ? `${' '.repeat(childIndent)}${expr}` : expr)+''
    : typeof expr[0]!=='string'
      // List array
      ? `${spaces}(${
          expr.map((e, i) => toFormattedString(e, {
            indent: i===0 ? 0 : !Array.isArray(e) ? (childIndent+1) : childIndent,
            childIndent: childIndent+(i===0 ? 0 : 1),
            inner: true
          })).join('\n')
        })`
      // Function in list form
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
              // Function arguments
              : "\n"+(
                expr.slice(2).map(e => toFormattedString(e, {
                  indent: childIndent+( expr[0]==='lambda' ? 1 : (expr[0]+'').length )+2, // "("+name+space+"("
                  inner: true
                })).join('\n')))
      })`
}
