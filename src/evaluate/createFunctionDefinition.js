import {
  IFUNDEFANON,
} from '../instruction'
import { err, ReturnJump, isSpreadOperator } from './utils'

export default function createFunctionDefinition({
  stack,
  argCount,
  functionType,
  localScope,
  resolveExpression
}) {

  // Function body
  const n2 = stack.pop()
  const args = []

  while (argCount-- > 0) {
    args.unshift(stack.pop())
  }

  // Variable name
  const n1 = functionType===IFUNDEFANON ? '' : stack.pop()

  const f = function () {

    const functionScope = assignArgumentsToLocalScope(args, arguments, localScope)

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

function assignArgumentsToLocalScope(expectedArgs, givenArgs, localScope) {

  const functionScope = Object.assign({}, localScope)

  let expectedArgIndex = 0
  let expectedArgsLength = expectedArgs.length

  let givenArgIndex = 0
  const givenArgsLength = givenArgs.length

  while (givenArgIndex < expectedArgsLength) {

    const varName = expectedArgs[expectedArgIndex]

    if (!isSpreadOperator(varName)) {
      functionScope[varName] = givenArgs[givenArgIndex]
      givenArgIndex++
      expectedArgIndex++
      continue
    }

    const spreadNum = givenArgsLength - givenArgIndex - 1
    const rangeEnd = givenArgIndex+spreadNum

    functionScope[varName.value] = Array.prototype.slice.call(givenArgs, givenArgIndex, rangeEnd)

    // Assign rest
    givenArgIndex = rangeEnd
    expectedArgIndex++
    expectedArgsLength += spreadNum - 1 // operator+value
  }

  return functionScope
}
