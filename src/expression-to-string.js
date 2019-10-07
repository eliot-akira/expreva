
// TODO: Feature complete with evaluate

import {
  INUMBER,
  IOP1,
  IOP2,
  IOP3,
  IVAR,
  IVARNAME,
  IFUNCALL,
  IFUNDEF,
  IEXPR,
  IMEMBER,
  IARRAY,
  IENDSTATEMENT
} from './instruction'

export default function expressionToString(tokens, toJS) {
  let nstack = []
  let n1, n2, n3
  let f, argCount, args
  for (let i = 0; i < tokens.length; i++) {
    const item = tokens[i]
    const type = item.type
    if (type === INUMBER) {
      if (typeof item.value === 'number' && item.value < 0) {
        nstack.push('(' + item.value + ')')
      } else {
        nstack.push(escapeValue(item.value))
      }
    } else if (type === IOP2) {
      n2 = nstack.pop()
      n1 = nstack.pop()
      f = item.value
      if (toJS) {
        if (f === '^') {
          nstack.push('Math.pow(' + n1 + ', ' + n2 + ')')
        } else if (f === 'and') {
          nstack.push('(!!' + n1 + ' && !!' + n2 + ')')
        } else if (f === 'or') {
          nstack.push('(!!' + n1 + ' || !!' + n2 + ')')
        } else if (f === '||') {
          nstack.push('(String(' + n1 + ') + String(' + n2 + '))')
        } else if (f === '==') {
          nstack.push('(' + n1 + ' === ' + n2 + ')')
        } else if (f === '!=') {
          nstack.push('(' + n1 + ' !== ' + n2 + ')')
        } else {
          nstack.push('(' + n1 + ' ' + f + ' ' + n2 + ')')
        }
      } else {
        nstack.push('(' + n1 + ' ' + f + ' ' + n2 + ')')
      }
    } else if (type === IOP3) {
      n3 = nstack.pop()
      n2 = nstack.pop()
      n1 = nstack.pop()
      f = item.value
      if (f === '?') {
        nstack.push('(' + n1 + ' ? ' + n2 + ' : ' + n3 + ')')
      } else {
        throw new Error('Unknown operator "'+f+'"')
        //throw new Error('Invalid expression')
      }
    } else if (type === IVAR || type === IVARNAME) {
      nstack.push(item.value)
    } else if (type === IOP1) {
      n1 = nstack.pop()
      f = item.value
      if (f === '-' || f === '+') {
        nstack.push('(' + f + n1 + ')')
      } else if (toJS) {
        if (f === 'not') {
          nstack.push('(' + '!' + n1 + ')')
        } else if (f === '!') {
          nstack.push('fac(' + n1 + ')')
        } else {
          nstack.push(f + '(' + n1 + ')')
        }
      } else if (f === '!') {
        nstack.push('(' + n1 + '!)')
      } else {
        nstack.push('(' + f + ' ' + n1 + ')')
      }
    } else if (type === IFUNCALL) {
      argCount = item.value
      args = []
      while (argCount-- > 0) {
        args.unshift(nstack.pop())
      }
      f = nstack.pop()
      nstack.push(f + '(' + args.join(', ') + ')')
    } else if (type === IFUNDEF) {
      n2 = nstack.pop()
      argCount = item.value
      args = []
      while (argCount-- > 0) {
        args.unshift(nstack.pop())
      }
      n1 = nstack.pop()
      if (toJS) {
        nstack.push(n1 + ' = function(' + args.join(', ') + ') { return ' + n2 + ' }')
      } else {
        nstack.push(n1 + '(' + args.join(', ') + ') => ' + n2)
      }
    } else if (type === IMEMBER) {
      n1 = nstack.pop()
      nstack.push(n1 + '.' + item.value)
    } else if (type === IARRAY) {
      argCount = item.value
      args = []
      while (argCount-- > 0) {
        args.unshift(nstack.pop())
      }
      nstack.push('[' + args.join(', ') + ']')
    } else if (type === IEXPR) {
      nstack.push('(' + expressionToString(item.value, toJS) + ')')
    } else if (type === IENDSTATEMENT) {
      // eslint-disable no-empty
    } else {
      throw new Error('Invalid expression "'+type+'"')
    }
  }
  if (nstack.length > 1) {
    // throw new Error('invalid Expression (parity)');
    nstack = [ nstack.join(',') ]
  }
  return String(nstack[0])
}

function escapeValue(v) {
  if (typeof v === 'string') {
    return JSON.stringify(v).replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029')
  }
  return v
}
