import { Expression, Lambda } from '../evaluate'

/**
 * Format symbolic expression to compact string
 */
export const toString = (
  expr: Expression,
  inner: boolean = false
): string =>
  !Array.isArray(expr)
    ? expr==null ? 'nil'
      : typeof expr==='object'
        ? toString(['obj', Object.keys(expr).map(key => [key, expr[key]])])
        : (inner ? expr : expr)+''
    : `(${
      expr.map(e => e==='lambda' ? 'λ' : toString(e as Expression, true)).join(' ')
    })`

/**
 * Format symbolic expression to pretty string
 */
export const toPrettyString = (
  expr: Expression,
  internalProps?: { [key: string]: any }
): string => {

  const {
    indent = 0,
    childIndent = indent as number,
    top = true,
    inner = false
  } = internalProps || {}

  // Native function
  if (expr instanceof Function) {
    return (expr as Lambda).lambda
      ? expr.toString()
      : expr.name ? expr.name : '(native function)'
  }

  if (!Array.isArray(expr)) {
    // Primitive value
    return expr==null ? 'nil'
      : typeof expr==='object'
        // Object
        ? toPrettyString(['obj', ...Object.keys(expr).map(key => [key, expr[key]])], {
          indent,
          childIndent,
          top: false,
          inner: true
        })
        : (inner ? `${' '.repeat(childIndent)}${expr}` : expr)+''
  }

  const spaces = ' '.repeat(indent)
  let prefix = `(`

  // List form
  if (typeof expr[0]==='string') {

    const isLambda = expr[0]==='lambda'
    const isQuoted = expr[0]==='expr'

    const funcName = isLambda ? 'λ' : isQuoted ? '`' : expr[0]

    if (isQuoted && typeof expr[1]==='string') {
      // Quoted string
      let str = JSON.stringify(expr[1])
      str = str.substr(1, str.length-2)
      return `${spaces}${prefix}${
        "'" + str.replace(/'/g, "\\'") + "'"
      })`
    }

    prefix += funcName + (expr.length > 1 ? ' ' : '')
    const prefixLength = prefix.length

    const args = expr.slice(1)
    if (!args || !args.length) return `${spaces}${prefix})`

    let firstArg = args.shift() || []

    if (isLambda) {
      // Argument definition
      firstArg = '('+(firstArg as []).join(' ')+')'
    }  else {
      // First argument on same line as function name
      firstArg = toPrettyString(expr[1], {
        indent: 0,
        childIndent: childIndent+prefixLength,
        top: false,
        // inner: true // No indent
      })
    }

    const body = !args.length ? '' : "\n"+(
      args.map(e => toPrettyString(e, {
        indent: childIndent + prefixLength, // "("+name+space+"("
        inner: true
      })).join('\n'))

    return `${spaces}${prefix}${firstArg}${body})`
  }

  if (top && !expr.length) return '' // Empty list of instructions

  // Array
  // prefix += '' // 'list' + (expr.length ? ' ' : '')
  const prefixLength = prefix.length

  return `${spaces}${prefix}${
    expr.map((e, i) => toPrettyString(e, {
      indent: i===0 ? 0 : (childIndent + prefixLength), //!Array.isArray(e) ? (childIndent + prefixLength) : childIndent,
      childIndent: childIndent + prefixLength,
      top: false,
      inner: i > 0
    })).join('\n')
  })`

}
