import { IVAR, IMEMBER, IEXPR, IVARNAME } from './instruction'
import { contains } from './utils'

export default function getSymbols(tokens, symbols, options) {
  options = options || {}
  const withMembers = true //!!options.withMembers
  let prevVar = null

  for (let i = 0; i < tokens.length; i++) {
    const item = tokens[i]
    if (item.type === IVAR || item.type === IVARNAME) {
      if (!withMembers && !contains(symbols, item.value)) {
        symbols.push(item.value)
      } else if (prevVar !== null) {
        if (!contains(symbols, prevVar)) {
          symbols.push(prevVar)
        }
        prevVar = item.value
      } else {
        prevVar = item.value
      }
    } else if (item.type === IMEMBER && withMembers && prevVar !== null) {
      prevVar += '.' + item.value
    } else if (item.type === IEXPR) {
      getSymbols(item.value, symbols, options)
    } else if (prevVar !== null) {
      if (!contains(symbols, prevVar)) {
        symbols.push(prevVar)
      }
      prevVar = null
    }
  }

  if (prevVar !== null && !contains(symbols, prevVar)) {
    symbols.push(prevVar)
  }
}
