import {
  IVARNAME,
  IMEMBER,
} from '../instruction'
import { err } from './utils'

export default function assignVariableMember({
  stack, instrs,
  set, varMembers, valueExpr,
  resolveExpression,
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
      stack.push(parentValue[memberName])
      return true
    }

    if (typeof currentValue==='undefined') {
      return err('Variable member assignment requires array or object as member: '
        +[varName, ...memberNames].join('.')
      )
    }

    parentValue = currentValue
  }

  return err('Variable member not found for assignment: '+[varName, ...memberNames].join('.'))
}
