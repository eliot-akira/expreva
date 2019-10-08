import {
  INUMBER,
  IOP1,
  IOP2,
  IOP3,
  IVAR,
  IVARNAME,
  IVARNAME_MEMBER,

  IFUNDEF,
  IFUNDEFANON,
  IFUNCALL,
  IFUNAPPLY,

  IEXPR,
  IMEMBER,

  IARRAY,
  IOBJECT,

  IENDSTATEMENT,
  IEXPREVAL
} from './instruction'

function err(arg) {
  throw new Error(arg)
}

export default function evaluate(instrs, expr, scope = {}) {

  if (typeof instrs==='undefined') return instrs

  if (isExpressionEvaluator(instrs)) {
    return resolveExpression(instrs)
  }

  const stack = []
  const functionContext = {
    global: expr, // { scope, tokens, parser, functions, ... }
    local: { scope }
  }

  function callWithContext(f, args) {
    return f.apply(functionContext, args)
  }

  function findVariable(name) {
    return name==='global' ? functionContext[name].scope
      : name==='local' ? functionContext[name].scope
        : typeof scope[name]!=='undefined' ? scope[name]
          : typeof expr.scope[name]!=='undefined' ? expr.scope[name]
            : expr.functions[name]
  }

  let f, n1, n2, n3
  let args, argCount
  for (let index = 0, len = instrs.length; index < len; index++) {

    const instr = instrs[index]
    const type = instr.type

    switch (type) {

    case INUMBER:
    case IVARNAME:
    case IEXPREVAL:
      stack.push(instr.value)
      break

    case IVARNAME_MEMBER:
    // IARRAY_DESTRUCTURE:
    // IOBJECT_DESTRUCTURE:

      // Push the instr itself for assignment types
      stack.push(instr)
      break


    case IVAR:
      n1 = instr.value
      n2 = findVariable(n1)
      if (typeof n2==='undefined') {
        return err('Undefined variable "' + n1 + '"')
      }
      stack.push(n2)
      break

    case IEXPR:
      // Expression - Defer evaluation
      stack.push(createExpressionEvaluator(instr, expr, scope))
      break

    case IENDSTATEMENT:
      stack.pop()
      break

    case IOP1:
      n1 = stack.pop()

      if (instr.value==='return') return resolveExpression(n1)

      f = expr.unaryOps[instr.value]
      stack.push(f(resolveExpression(n1)))
      break

    case IOP2:

      n2 = stack.pop()
      n1 = stack.pop()

      if (instr.value === 'and' || instr.value === '&&') {
        stack.push(n1 ? !!evaluate(n2, expr, scope) : false)
        break
      }
      if (instr.value === 'or' || instr.value === '||') {
        stack.push(n1 ? true : !!evaluate(n2, expr, scope))
        break
      }
      if (instr.value !== '=') {
        f = expr.binaryOps[instr.value]
        stack.push(callWithContext(f, [resolveExpression(n1), resolveExpression(n2)]))
        break
      }

      // Assignment: variable name, member, destructure array/object

      f = expr.binaryOps[instr.value]

      if (typeof n1==='string') {
        stack.push(callWithContext(f, [n1, resolveExpression(n2)]))
        break
      }

      if (!n1 || n1.type!==IVARNAME_MEMBER) {
        return err('Variable name, member or destructuring expected for assignment')
      }

      assignVariableMember({
        stack, instrs,
        set: f,
        varMembers: n1.value,
        valueExpr: n2,
        callWithContext,
        findVariable
      })

      break

    case IOP3:
      n3 = stack.pop()
      n2 = stack.pop()
      n1 = stack.pop()
      if (instr.value === '?' || instr.value === 'if') {
        stack.push(evaluate(n1 ? n2 : n3, expr, scope))
      } else {
        f = expr.ternaryOps[instr.value]
        stack.push(f(resolveExpression(n1), resolveExpression(n2), resolveExpression(n3)))
      }
      break

    case IARRAY: {
      let argCount = instr.value
      const args = []
      while (argCount-- > 0) {
        args.unshift(resolveExpression(stack.pop()))
      }
      stack.push(args)
    }  break

    case IOBJECT: {
      let keyValuePairCount = instr.value
      const obj = {}
      while (keyValuePairCount-- > 0) {
        n2 = resolveExpression(stack.pop())
        n1 = resolveExpression(stack.pop())
        obj[n1] = n2
      }
      stack.push(obj)
    }  break

    case IFUNCALL:

      args = []
      argCount = instr.value
      while (argCount-- > 0) {
        args.unshift(resolveExpression(stack.pop()))
      }

      f = stack.pop()
      n1 = undefined

      if (isExpressionEvaluator(f)) {
        f = resolveExpression(f)
        n1 = f instanceof Function ? callWithContext(f, args) : f
      } else if (f instanceof Function) {
        n1 = callWithContext(f, args)
      } else {
        // Calling a value other than function or expression returns itself
        //n1 = f
        return err('"' + f + '" is not a function')
      }

      stack.push(n1)
      //return err('"' + f + '" is not a function')
      break

    case IFUNDEFANON:
    //case IFUNDEF:

      // Function closure to keep references
      stack.push((function () {

        const n2 = stack.pop()
        const args = []
        let argCount = instr.value

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
      n2 = instr.value
      n1 = stack.pop()
      f = typeof n2==='object' && n2.type===IEXPR
        ? evaluate(n2.value, expr, scope)
        : findVariable(n2) // n2

      if (f instanceof Function) {
        if (isExpressionEvaluator(n1)) {
          stack.push(callWithContext(f, [resolveExpression(n1)]))
        } else {
          stack.push(callWithContext(f, [n1]))
        }
      } else {
        return err('Cannot apply: not a function '+f)
      }

      break

    case IMEMBER:
      n2 = instr.value
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
      return err('Unknown instruction '+type+` "${instr}"`)
    }

  } // Loop instrs

  n1 = stack.pop()

  return n1 === -0 ? 0 : resolveExpression(n1) // eslint-disable-line no-compare-neg-zero
}

function isExpressionEvaluator(n) {
  return n && n.type === IEXPREVAL
}

function createExpressionEvaluator(instr, expr, scope) {
  if (isExpressionEvaluator(instr)) return instr
  return {
    type: IEXPREVAL,
    value: instr instanceof Function
      ? instr
      : function (localScope) {

        // Unused for now
        if (localScope===false) return instr.value

        return evaluate(instr.value, expr, localScope || scope)
      }
  }
}

function resolveExpression(n, localScope, ...args) {
  return isExpressionEvaluator(n) ? n.value(localScope, ...args) : n
}

function assignVariableMember({
  stack, instrs,
  set, varMembers, valueExpr,
  callWithContext,
  findVariable
}) {

  // Find root variable

  let pos = 0
  let currentInstr = varMembers[pos]
  let rootVar, parentValue, currentValue

  const tailPos = varMembers.length - 1
  const varName = currentInstr.value

  if (currentInstr && currentInstr.type!==IVARNAME) {
    return err('Variable expected for member assignment')
  }

  rootVar = parentValue = findVariable(varName)

  if (typeof rootVar==='undefined') {
    return err('Variable not found for member assignment: '+varName)
  }

  if (typeof rootVar!=='object') {
    return err('Variable member assignment requires array or object as root: '+varName)
  }

  // Reach into members

  const memberNames = []

  while (++pos && (currentInstr = varMembers[pos]) && currentInstr.type===IMEMBER) {

    const memberName = currentInstr.value

    memberNames.push(memberName)

    currentValue = parentValue[memberName]

    if (pos===tailPos) {

      parentValue[memberName] = resolveExpression(valueExpr)

      // Assign the whole object back to variable
      callWithContext(set, [varName, rootVar])

      // Result of member assignment
      stack.push(parentValue[memberName])

      return true
    }

    if (typeof currentValue==='undefined') {
      return err('Variable member assignment requires array or object as member: '
        +varName+(memberNames.length ? '.'+(memberNames.join('.')) : '')
      )
    }

    parentValue = currentValue
  }

  return err('Variable member not found for assignment: '+[varName, ...memberNames].join('.'))
}
