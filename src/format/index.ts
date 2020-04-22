import { Expression, Lambda } from '../evaluate'

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

let valuesSeen = new Map

export const valueToExpression = (
  value: any,
  inner = false
): Expression => {

  if (!inner) valuesSeen.clear()
  else if (valuesSeen.get(value)) {
    return '..'
  }

  if (value==null) return 'nil' // inner ? 'nil' : ''
  if (typeof value==='object') {
    valuesSeen.set(value, true)
    if (Array.isArray(value)) {
      return ['list', ...value.map(e => valueToExpression(e, true))]
    }
    // Obj -> (obj (key value))
    return ['obj', ...Object.keys(value).map(k => [k, valueToExpression(value[k], true)])]
  }
  // String
  if (typeof value==='string') return JSON.stringify(value) //['`', value]
  if (typeof value==='boolean') return value ? 'true' : 'false'
  if (typeof value==='function') {
    return value.lambda ? value.toString() : (
      value.name && !value.name.match(/^bound/) ? value.name : 'λ'
    )
  }

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
    // Primitive value
    return expr==null ? 'nil'
      : typeof expr==='object'
        // Object
        ? toFormattedString(['obj', ...Object.keys(expr).map(key => [key, expr[key]])], {
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
    const funcName = isLambda ? 'λ' : expr[0]
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
