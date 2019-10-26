import { toUtf16 } from '../utils'

export function char(val) {
  return toUtf16(val) // parseInt(val, 16)
}
