import {
  INUMBER,
  IOP1,
  IOP2,
  IOP3,
  IVAR,
  IVARNAME,
  IFUNDEF,
  IFUNDEFANON,
  IFUNCALL,
  IFUNAPPLY,
  IEXPR,
  IMEMBER,
  IARRAY,
  IOBJECT,
  IENDSTATEMENT,

  // Only used inside evaluate
  IEXPREVAL
} from './instruction'

export default function evaluate(tokens, expr, scope = {}) {

  if (typeof tokens==='undefined') return tokens

  if (isExpressionEvaluator(tokens)) {
    return resolveExpression(tokens)
  }

  const stack = []
  let f, n1, n2, n3
  let args, argCount

  const functionContext = {
    global: expr,
    local: {
      scope
    }
  }

  function err(arg) {
    throw new Error(arg)
  }

  function findVariable(name) {
    return typeof scope[name]!=='undefined'
      ? scope[name]
      : typeof expr.scope[name]!=='undefined'
        ? expr.scope[name]
        : expr.functions[name]
  }

  for (let i = 0, len = tokens.length; i < len; i++) {

    const token = tokens[i]
    const type = token.type

    switch (type) {

    case INUMBER:
    case IVARNAME:
    case IEXPREVAL:
      stack.push(token.value)
      break

    case IVAR:

      n1 = token.value
      n2 = findVariable(n1)

      if (typeof n2==='undefined') {
        return err('Undefined variable "' + n1 + '"')
      }

      stack.push(n2)

      break

    case IOP1:

      n1 = stack.pop()

      if (token.value==='return') return resolveExpression(n1)

      f = expr.unaryOps[token.value]
      stack.push(f(resolveExpression(n1)))

      break

    case IOP2:
      n2 = stack.pop()
      n1 = stack.pop()
      if (token.value === 'and') {
        stack.push(n1 ? !!evaluate(n2, expr, scope) : false)
      } else if (token.value === 'or') {
        stack.push(n1 ? true : !!evaluate(n2, expr, scope))
      } else {
        f = expr.binaryOps[token.value]
        stack.push(f.apply(functionContext, [resolveExpression(n1), resolveExpression(n2)]))
      }
      break

    case IOP3:
      n3 = stack.pop()
      n2 = stack.pop()
      n1 = stack.pop()
      if (token.value === '?' || token.value === 'if') {
        stack.push(evaluate(n1 ? n2 : n3, expr, scope))
      } else {
        f = expr.ternaryOps[token.value]
        stack.push(f(resolveExpression(n1), resolveExpression(n2), resolveExpression(n3)))
      }
      break

    case IEXPR:
      stack.push(createExpressionEvaluator(token, expr, scope))
      break

    case IENDSTATEMENT:
      stack.pop()
      break

    case IARRAY: {
      let argCount = token.value
      const args = []
      while (argCount-- > 0) {
        args.unshift(resolveExpression(stack.pop()))
      }
      stack.push(args)
    }  break

    case IOBJECT: {
      let keyValuePairCount = token.value
      const obj = {}
      while (keyValuePairCount-- > 0) {
        n2 = resolveExpression(stack.pop())
        n1 = resolveExpression(stack.pop())
        obj[n1] = n2
      }
      stack.push(obj)
    }  break

    case IFUNCALL: {

      args = []
      argCount = token.value
      while (argCount-- > 0) {
        args.unshift(resolveExpression(stack.pop()))
      }

      f = stack.pop()
      n1 = undefined

      if (isExpressionEvaluator(f)) {
        f = resolveExpression(f)
        n1 = f instanceof Function ? f.apply(functionContext, args) : f
      } else if (f instanceof Function) {
        n1 = f.apply(functionContext, args)
      } else {
        // Calling a value other than function or expression returns itself
        n1 = f
      }

      stack.push(n1)
      //return err('"' + f + '" is not a function')
    }
      break

    case IFUNDEFANON:
    case IFUNDEF:
      // Function closure to keep references
      stack.push((function () {

        const n2 = stack.pop()
        const args = []
        let argCount = token.value

        while (argCount-- > 0) {
          args.unshift(stack.pop())
        }

        // Variable name
        const n1 = type===IFUNDEFANON ? '' : stack.pop()

        const f = function () {
          // Pass function arguments to local scope
          const localScope = Object.assign({}, scope)
          for (let i = 0, len = args.length; i < len; i++) {
            localScope[args[i]] = arguments[i]
          }
          return resolveExpression(n2, localScope)
        }

        // f.name = n1
        Object.defineProperty(f, 'name', {
          value: n1 || 'anonymous',
          writable: false
        })

        if (n1) scope[n1] = f // expr.functions

        return f
      })())
      break
    case IFUNAPPLY:
      n2 = token.value
      n1 = stack.pop()
      f = typeof n2==='object' && n2.type===IEXPR
        ? evaluate(n2.value, expr, scope)
        : findVariable(n2) // n2

      if (f instanceof Function) {
        if (isExpressionEvaluator(n1)) {
          stack.push(f.apply(functionContext, [resolveExpression(n1)]))
        } else {
          stack.push(f.apply(functionContext, [n1]))
        }
      } else {
        return err('Cannot apply: not a function '+f)
      }

      break
    case IMEMBER:
      n2 = token.value
      n1 = stack.pop()
      f = typeof n2==='object' && n2.type===IEXPR
        ? evaluate(n2.value, expr, scope)
        : n2

      // Prevent climbing native prototype
      n3 = n1 && Object.prototype.hasOwnProperty.call(n1, f) ? n1[f] : undefined

      if (f instanceof Function) {
        n3 = f(n1, expr, scope)
      }
      stack.push(n3)
      break
    default:
      return err('Unknown instruction '+type+` "${token}"`)
    }
  }

  n1 = stack.pop()

  return n1 === -0 ? 0 : resolveExpression(n1) // eslint-disable-line no-compare-neg-zero
}

function isExpressionEvaluator(n) {
  return n && n.type === IEXPREVAL
}

function createExpressionEvaluator(token, expr, scope) {
  if (isExpressionEvaluator(token)) return token
  return {
    type: IEXPREVAL,
    value: token instanceof Function
      ? token
      : function (localScope) {
        if (localScope===false) return token.value
        return evaluate(token.value, expr, localScope || scope)
      }
  }
}

function resolveExpression(n, localScope, ...args) {
  return isExpressionEvaluator(n) ? n.value(localScope, ...args) : n
}
