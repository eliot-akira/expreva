
export function contains(array, obj) {
  for (let i = 0; i < array.length; i++) {
    if (array[i] === obj) {
      return true
    }
  }
  return false
}

export function toUtf16(codePoint) {

  const TEN_BITS = parseInt('1111111111', 2)

  if (codePoint <= 0xFFFF) {
    return String.fromCharCode(codePoint)
  }

  codePoint -= 0x10000

  // Shift right to get to most significant 10 bits
  const leadSurrogate = 0xD800 + (codePoint >> 10)

  // Mask to get least significant 10 bits
  const tailSurrogate = 0xDC00 + (codePoint & TEN_BITS)

  return String.fromCharCode(leadSurrogate, tailSurrogate)
}
