import {
  IEXPREVAL,
  ISPREAD,
} from '../instruction'

export const isSpreadOperator = instr => typeof instr==='object' && instr.type===ISPREAD
export const isExpressionEvaluator = instr => typeof instr==='object' && instr.type===IEXPREVAL

export function err(arg) {
  // TODO: getCoordinates
  throw new Error(arg)
}

export class ReturnJump {
  constructor(value) {
    this.value = value
  }
}
