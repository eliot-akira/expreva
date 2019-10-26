import {
  IVARNAME,
  IFUNDEFANON,
} from '../instruction'
import { err, ReturnJump, isSpreadOperator, isExpressionEvaluator } from './utils'

export default function createFunctionDefinition({
  stack,
  argCount,
  functionType,
  localScope,
  resolveExpression
}) {

  // Function body
  const n2 = stack.pop()
  const args: any[] = []

  while (argCount-- > 0) {
    args.unshift(stack.pop())
  }

  // Variable name
  const n1 = functionType===IFUNDEFANON ? '' : stack.pop()

  const f = function () {

    const functionScope = assignArgumentsToLocalScope({
      expectedArgs: args,
      givenArgs: arguments,
      localScope,
      resolveExpression
    })

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
}

function assignArgumentsToLocalScope({
  expectedArgs,
  givenArgs,
  localScope,
  resolveExpression
}) {

  const functionScope = Object.assign({}, localScope)

  let expectedArgIndex = 0
  let expectedArgsLength = expectedArgs.length

  let givenArgIndex = 0
  const givenArgsLength = givenArgs.length

  while (givenArgIndex < expectedArgsLength) {

    const varName = expectedArgs[expectedArgIndex]
    if (isExpressionEvaluator(varName)) {

      // Default assignment
      if (typeof givenArgs[givenArgIndex]==='undefined') {
        resolveExpression(varName, functionScope)
      } else if (varName.instructions) {
        // Override default with given arg
        const exprVarName = varName.instructions[0]
        if (exprVarName && exprVarName.type===IVARNAME) {
          functionScope[exprVarName.value] = givenArgs[givenArgIndex]
        }
      }
      givenArgIndex++
      expectedArgIndex++
      continue
    }

    if (!isSpreadOperator(varName)) {
      functionScope[varName] = givenArgs[givenArgIndex]
      givenArgIndex++
      expectedArgIndex++
      continue
    }

    const spreadNum = givenArgsLength - (expectedArgsLength - expectedArgIndex) //givenArgIndex - 1
    const rangeEnd = givenArgIndex + spreadNum

    functionScope[varName.value] = Array.prototype.slice.call(givenArgs, givenArgIndex, rangeEnd)

    // Assign rest
    givenArgIndex = rangeEnd
    expectedArgIndex++
    expectedArgsLength += spreadNum - 1 // operator+value
  }

  return functionScope
}
