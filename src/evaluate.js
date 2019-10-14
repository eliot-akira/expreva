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
import { unaryOps, binaryOps, ternaryOps, functions, constants } from './functions/builtIns'

// Used inside evaluate only
const ISPREAD = 'ISPREAD'

function err(arg) {
  // TODO: getCoordinates
  throw new Error(arg)
}

class ReturnJump {
  constructor(value) {
    this.value = value
  }
}

export default function evaluateWithReturnCatch(instrs, globalScope = {}, localScope = {}) {
  // Catch return
  let value
  try {
    value = evaluate(instrs, globalScope, localScope)
  } catch(e) {
    if (e instanceof ReturnJump) {
      value = e.value
    } else throw e
  }
  return value
}

function evaluate(instrs, globalScope = {}, localScope = {}) {

  if (typeof instrs==='undefined') return instrs

  if (isExpressionEvaluator(instrs)) {
    return resolveExpression(instrs)
  }

  const stack = []
  const context = {
    global: { scope: globalScope },
    local: { scope: localScope }
  }

  function callWithContext(f, args) {
    return f.apply(context, args)
  }

  function findVariable(name) {
    return (
      name==='global' ? globalScope
        : name==='local' ? localScope
          : typeof localScope[name]!=='undefined' ? localScope[name]
            : typeof globalScope[name]!=='undefined' ? globalScope[name]
              : functions[name]
    )
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

      // Push the instruction itself for assignment types
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
      stack.push(createExpressionEvaluator(instr, globalScope, localScope))
      break

    case IENDSTATEMENT:
      stack.pop()
      break

    case IOP1:
      n1 = stack.pop()

      if (instr.value==='return') {
        //return resolveExpression(n1)
        throw new ReturnJump(resolveExpression(n1))
      } else if (instr.value==='...') {
        stack.push({ type: ISPREAD, value: resolveExpression(n1) })
        break
      }

      f = unaryOps[instr.value]
      stack.push(f(resolveExpression(n1)))
      break

    case IOP2:

      n2 = stack.pop()
      n1 = stack.pop()

      if (instr.value === 'and' || instr.value === '&&') {
        stack.push(n1 ? !!resolveExpression(n2) : false)
        break
      }
      if (instr.value === 'or' || instr.value === '||') {
        stack.push(n1 ? true : !!resolveExpression(n2))
        break
      }
      if (instr.value !== '=') {
        f = binaryOps[instr.value]
        stack.push(callWithContext(f, [resolveExpression(n1), resolveExpression(n2)]))
        break
      }

      // Assignment: variable name, member, destructure array/object

      f = binaryOps[instr.value]

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
        stack.push(resolveExpression(n1 ? n2 : n3))
      } else {
        f = ternaryOps[instr.value]
        stack.push(f(resolveExpression(n1), resolveExpression(n2), resolveExpression(n3)))
      }
      break

    case IARRAY: {
      let argCount = instr.value
      const args = []
      while (argCount-- > 0) {
        const arg = stack.pop()
        if (typeof arg==='object' && arg.type===ISPREAD) {
          args.unshift(...arg.value)
        } else {
          args.unshift(resolveExpression(arg))
        }
      }
      stack.push(args)
    }  break

    case IOBJECT: {
      let keyValuePairCount = instr.value
      const obj = {}
      while (keyValuePairCount-- > 0) {
        n2 = resolveExpression(stack.pop())
        if (typeof n2==='object' && n2.type===ISPREAD) {
          Object.assign(obj, n2.value)
          continue
        }
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
          const functionScope = Object.assign({}, localScope)
          for (let i = 0, len = args.length; i < len; i++) {
            functionScope[args[i]] = arguments[i]
          }

          // Catch return
          let value
          try {
            value = resolveExpression(n2, functionScope)
          } catch(e) {
            if (e instanceof ReturnJump) {
              value = e.value
            } else throw e
          }

          return value
        }

        // f.name = n1
        Object.defineProperty(f, 'name', {
          value: n1 || 'anonymous',
          writable: false
        })

        if (n1) localScope[n1] = f

        return f
      })())
      break

    case IFUNAPPLY:
      n2 = instr.value
      n1 = stack.pop()
      f = typeof n2==='object' && n2.type===IEXPR
        ? evaluate(n2.value, globalScope, localScope)
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
        ? evaluate(n2.value, globalScope, localScope)
        : n2

      // Prevent climbing native prototype
      n3 = n1 && Object.prototype.hasOwnProperty.call(n1, f) ? n1[f] : undefined

      if (f instanceof Function) {
        n3 = f(n1, globalScope, localScope)
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

function createExpressionEvaluator(instr, globalScope, localScope) {
  if (isExpressionEvaluator(instr)) return instr
  return {
    type: IEXPREVAL,
    value: instr instanceof Function
      ? instr
      : function (functionScope) {

        // Unused for now
        if (functionScope===false) return instr.value

        return evaluate(instr.value, globalScope, functionScope || localScope)
      }
  }
}

function resolveExpression(n, functionScope, ...args) {
  return isExpressionEvaluator(n) ? n.value(functionScope, ...args) : n
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
