import {
  ISPREAD,
} from '../instruction'

export const isSpreadOperator = instr => typeof instr==='object' && instr.type===ISPREAD

export function err(arg) {
  // TODO: getCoordinates
  throw new Error(arg)
}

export class ReturnJump {
  constructor(value) {
    this.value = value
  }
}
