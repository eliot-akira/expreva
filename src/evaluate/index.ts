import {
  Instructions, Instruction, InstructionType, InstructionValue,

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
  IARRAY,
  IOBJECT,
  ISPREAD,
  IMEMBER,

  IENDSTATEMENT,
  IEXPREVAL
} from '../instruction'
import { unaryOps, binaryOps, ternaryOps, functions, constants } from '../functions/builtIns'
import { err, ReturnJump, isSpreadOperator, isExpressionEvaluator } from './utils'
import createFunctionDefinition from './createFunctionDefinition'
import assignVariableMember from './assignVariableMember'
import { Scope, Options } from '../types'

export default function evaluateWithCatchReturn(
  instrs: Instructions,
  globalScope: Scope = {},
  localScope: Scope = {},
  options: Options = {}
): any {
  // Catch top-level return
  let value: any
  try {
    value = evaluate(instrs, globalScope, localScope, options)
  } catch(e) {
    if (e instanceof ReturnJump) {
      value = e.value
    } else throw e
  }
  return value
}

function evaluate(
  instrs: Instructions,
  globalScope: Scope = {},
  localScope: Scope = {},
  options: Options = {}
): any {

  if (typeof instrs==='undefined') return instrs

  if (isExpressionEvaluator(instrs)) {
    return resolveExpression(instrs)
  }

  const stack: any[] = []
  const context = {
    global: { scope: globalScope },
    local: { scope: localScope },
    options
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
      stack.push(createExpressionEvaluator(instr, globalScope, localScope, options))
      break
    case IENDSTATEMENT:
      // Resolve last expression on stack, if any
      resolveExpression(stack.pop())
      break

    case IOP1:
      n1 = stack.pop()

      if (instr.value==='return') {
        // Jump back to try catch in function definition
        throw new ReturnJump(resolveExpression(n1))
      }

      if (instr.value==='...') {
        // Defer resolving expression until actual spread
        // TODO: Define behavior when used outside of array, object, or function argument
        stack.push(typeof n1==='undefined' ? n1 : { type: ISPREAD, value: n1 })
        break
      }

      f = unaryOps[instr.value as string]
      stack.push(callWithContext(f, [resolveExpression(n1)]))
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
        f = binaryOps[instr.value as string]
        stack.push(callWithContext(f, [resolveExpression(n1), resolveExpression(n2)]))
        break
      }

      // Assignment: variable name, member, destructure array/object

      f = binaryOps[instr.value as string]

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
        resolveExpression,
        callWithContext,
        findVariable
      })

      break

    case IOP3:
      n3 = stack.pop()
      n2 = stack.pop()
      n1 = stack.pop()
      if (instr.value === '?' || instr.value === 'if') {
        stack.push(resolveExpression(resolveExpression(n1) ? n2 : n3))
      } else {
        f = ternaryOps[instr.value as string]
        stack.push(callWithContext(f, [resolveExpression(n1), resolveExpression(n2), resolveExpression(n3)]))
      }
      break

    case IARRAY: {
      let argCount = instr.value as number
      const args: any[] = []
      while (argCount-- > 0) {
        const arg = stack.pop()
        if (isSpreadOperator(arg)) {
          args.unshift(...resolveExpression(arg.value))
        } else {
          args.unshift(resolveExpression(arg))
        }
      }
      stack.push(args)
    }  break

    case IOBJECT: {
      let keyValuePairCount = instr.value as number
      const obj = {}
      while (keyValuePairCount-- > 0) {
        n2 = resolveExpression(stack.pop())
        if (isSpreadOperator(n2)) {
          Object.assign(obj, resolveExpression(n2.value))
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
      break

    case IFUNDEFANON:
    //case IFUNDEF:
      stack.push(createFunctionDefinition({
        stack,
        functionType: instr.type,
        argCount: instr.value,
        localScope,
        resolveExpression
      }))
      break

    case IFUNAPPLY:
      n2 = instr.value
      n1 = stack.pop()
      f = typeof n2==='object' && n2.type===IEXPR
        ? evaluate(n2.value, globalScope, localScope, options)
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
      f = isExpressionEvaluator(n2)
        ? resolveExpression(n2)
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

function createExpressionEvaluator(
  instr: Instruction,
  globalScope?: Scope,
  localScope?: Scope,
  options: Options = {}
) {
  if (isExpressionEvaluator(instr)) return instr
  return {
    type: IEXPREVAL,
    instructions: instr.value,
    value: instr instanceof Function
      ? instr
      : function (functionScope?: Scope | false) {

        // Unused for now
        if (functionScope===false) return instr.value

        return evaluate(instr.value as Instructions, globalScope, functionScope || localScope, options)
      }
  }
}

function resolveExpression(n, functionScope?, ...args) {
  return isExpressionEvaluator(n) ? n.value(functionScope, ...args) : n
}
