import { Expression, Lambda } from './evaluate'

export const toString = (
  expr: Expression,
  inner: boolean = false
): string =>
  !Array.isArray(expr)
    ? typeof expr==='object'
      ? toString(['obj', Object.keys(expr).map(key => [key, expr[key]])])
      : expr==null ? '' : (inner ? expr : expr)+''
    : `(${
      expr.map(e => e==='lambda' ? 'λ' : toString(e as Expression, true)).join(' ')
    })`

export const valueToExpression = (
  value: any
): Expression => {

  if (typeof value==='object') {
    if (Array.isArray(value)) {
      return ['list', ...value.map(valueToExpression)]
    }
    // Obj -> (obj (key value))
    return ['obj', ...Object.keys(value).map(k => [k, valueToExpression(value[k])])]
  }
  // String
  if (typeof value==='string') return ['`', value]
  if (typeof value==='boolean') return value ? 'true' : 'false'
  if (value==null) return 'nil'

  // Number
  return value
}

export const toFormattedString = (
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
    // Object
    if (typeof expr==='object') {
      return toFormattedString(['obj', ...Object.keys(expr).map(key => [key, expr[key]])], {
        indent,
        childIndent,
        top: false,
        inner: true
      })
    }
    // Primitive value
    return expr==null ? '' : (inner ? `${' '.repeat(childIndent)}${expr}` : expr)+''
  }

  const spaces = ' '.repeat(indent)
  let prefix = `(`

  // List form
  if (typeof expr[0]==='string') {
    const isLambda = expr[0]==='lambda'
    const funcName = isLambda ? 'λ' : expr[0]
    prefix += funcName + (expr.length > 1 ? ' ' : '')
    const prefixLength = prefix.length

    const args = expr.slice(1)
    let firstArg = args.shift() || []

    if (isLambda) {
      // Argument definition
      firstArg = '('+(firstArg as []).join(' ')+')'
    } else {
      // First argument on same line as function name
      firstArg = toFormattedString(expr[1], {
        indent: 0,
        childIndent: childIndent+prefixLength,
        top: false,
        // inner: true // No indent
      })
    }

    const body = !args.length ? '' : "\n"+(
      args.map(e => toFormattedString(e, {
        indent: childIndent + prefixLength, // "("+name+space+"("
        inner: true
      })).join('\n'))

    return `${spaces}${prefix}${firstArg}${body})`
  }

  if (top && !expr.length) return '' // Empty list of instructions

  // Array
  prefix += '' // 'list' + (expr.length ? ' ' : '')
  const prefixLength = prefix.length

  return `${spaces}${prefix}${
    expr.map((e, i) => toFormattedString(e, {
      indent: i===0 ? 0 : childIndent + prefixLength, //!Array.isArray(e) ? (childIndent + prefixLength) : childIndent,
      childIndent: /*i===0 ? 0 : */ childIndent + prefixLength,
      top: false,
      inner: true
    })).join('\n')
  })`

}
