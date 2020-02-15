
// Array and object utilities

export function size(s) {
  if (typeof s==='undefined') return size
  return Array.isArray(s)
    ? s.length
    : typeof s==='object'
      ? Object.keys(s).length
      : String(s).length
}

// map, filter, reduce

export function map(fn, arr) {

  // Curried: map(fn)(arr)
  if (typeof arr==='undefined')  {
    return function(arg) {
      return map(fn, arg)
    }
  }

  // Reversed arguments: map(arr, fn)
  if (arr instanceof Function) {
    var _ = fn
    fn = arr
    arr = _
  }

  if (Array.isArray(arr)) {
    return arr.map(fn)
  }

  if (typeof arr==='object') {

    const keys = Object.keys(arr)
    const result = {}

    for (let i=0, len=keys.length; i < len; i++) {
      const key = keys[i]
      result[key] = fn(arr[key], key, i)
    }

    return result
  }

  return arr
}

export function filter(fn, arr) {

  // Curried: filter(fn)(arr)
  if (typeof arr==='undefined')  {
    return function(nextArr) {
      return filter(fn, nextArr)
    }
  }

  // Reversed arguments: filter(arr, fn)
  if (arr instanceof Function) {
    var _ = fn
    fn = arr
    arr = _
  }

  if (Array.isArray(arr)) {
    return arr.filter(fn)
  }

  if (typeof arr==='object') {

    const keys = Object.keys(arr)
    const result = {}

    for (let i=0, len=keys.length; i < len; i++) {
      const key = keys[i]
      if (!fn(arr[key], key, i)) continue
      result[key] = arr[key]
    }

    return result
  }

  return arr
}

export function reduce(arr, fn?, acc?) {

  // Curried: reduce(arr)(fn, acc)
  if (typeof fn==='undefined')  {
    return function(...args) {
      return reduce(arr, ...args)
    }
  }

  if (Array.isArray(arr)) {
    return arr.reduce(fn, acc)
  }

  if (typeof arr==='object') {
    const keys = Object.keys(arr)
    return keys
      .reduce(function(acc, key, i) {
        return fn(acc, arr[key], key, i)
      }, acc)
  }

  return arr
}

// push, pop, insert, slice, search, sort

export function push(arr, item, ...items) {

  // Curried: push(arr)(item)
  if (typeof item==='undefined')  {
    return function(nextItem, ...nextItems) {
      return push(arr, nextItem, ...nextItems)
    }
  }

  if (Array.isArray(arr)) {
    arr.push(item, ...items)
    return arr
  }

  if (typeof arr==='object') {
    items.unshift(item)
    items.forEach(function(i) {
      Object.assign(arr, i)
    })
    return arr
  }

  return arr
}

export function pop(arr, key) {

  if (Array.isArray(arr)) {
    return arr.pop()
  }

  if (typeof arr==='object') {
    if (!key) return {}
    const val = arr[key]
    delete arr[key]
    return val
  }

  return arr
}

export function insert(arr, index?, ...items) {
  if (Array.isArray(arr)) {
    if (typeof index==='undefined') {
      return (...args) => insert(arr, ...args)
    }
    arr.splice(index, 0, ...items)
    return arr
  }
  // String?
  return arr
}

export function slice(arr, start?, end?) {
  if (Array.isArray(arr)) {
    if (typeof start==='undefined') {
      return (...args) => slice(arr, ...args)
    }
    return arr.slice(start, end)
  }
  return arr
}

export function search(arr, item) {

  // Curried: search(arr)(item)
  if (typeof item==='undefined')  {
    return function(nextItem) {
      return search(arr, nextItem)
    }
  }

  // Reversed arguments: search(item, arr)
  // if (typeof arr==='string' || arr instanceof Function) {
  //   var _ = item
  //   item = arr
  //   arr = _
  // }

  if (Array.isArray(arr) || typeof arr==='string') {
    if (item instanceof Function) {
      for (let i=0, len=arr.length; i < len; i++) {
        if (item(arr[i])) return i
      }
      return -1
    }
    return arr.indexOf(item)
  }

  if (typeof arr==='object') {

    const keys = Object.keys(arr)

    if (item instanceof Function) {
      for (let i=0, len=keys.length; i < len; i++) {
        if (item(arr[ keys[i] ])) return keys[i]
      }
      // Not found for object returns undefined instead of -1
      return
    }

    for (let i=0, len=keys.length; i < len; i++) {
      if (item===arr[ keys[i] ]) return keys[i]
    }
    return
  }

  return arr
}

export function sort(arr, fn) {
  // Curried: sort(arr)(fn)
  if (typeof fn==='undefined')  {
    return function(arg = true) {
      return sort(arr, arg)
    }
  }

  if (arr instanceof Function) {
    let _ = arr
    arr = fn
    fn = _
  }

  if (fn===true) arr.sort()
  else arr.sort(fn)

  return arr
}

// keys, values

export function keys(arr) {

  if (Array.isArray(arr) || typeof arr==='string') {
    return Array.apply(null, { length: arr.length }).map(Number.call, Number)
  }

  if (typeof arr==='object') {
    return Object.keys(arr)
  }

  return arr
}

export function values(arr) {

  if (Array.isArray(arr)) return arr
  if (typeof arr==='string') return arr.split('')

  if (typeof arr==='object') {
    return Object.values(arr)
  }

  return arr
}

// join, split

export function join(arr, sep) {

  // Curried: join(arr)(sep)
  if (typeof sep==='undefined')  {
    return function(arg = '') {
      return join(arr, arg)
    }
  }

  // Reversed arguments
  if (typeof arr==='string' && Array.isArray(sep)) {
    var _ = arr
    arr = sep
    sep = _
  }

  // Join two arrays
  if (Array.isArray(sep)) {
    return arr.concat(sep)
  }

  if (Array.isArray(arr)) {
    return arr.join(sep)
  }

  if (typeof arr==='object') {
    return arr.assign(sep)
  }

  if (typeof arr==='string') {
    return arr+sep
  }

  return arr
}

export function split(arr, sep) {

  // Curried: split(arr)(sep)
  if (typeof sep==='undefined')  {
    return function(arg) {
      return split(arr, arg)
    }
  }

  if (typeof arr==='string') {
    return arr.split(sep)
  }

  // Split array
  if (Array.isArray(arr)) {
  }

  // Split object..?
  if (typeof arr==='object') {
  }

  return arr
}


// repeat

export function repeat(num, check, incr: number | ((i: number) => any) = 1) {

  // Curried: repeat(num)(check)
  if (typeof check==='undefined')  {
    return function(nextCheck, nextIncr) {
      return repeat.apply(this, [num, nextCheck, nextIncr])
    }
  }

  const {
    maxLoops = 10000
  } = this.options

  const arr: any[] = []

  // Reversed arguments: repeat(check, num)
  if (typeof check==='number') {
    let _ = check
    check = num
    num = _
  }

  // Create checker for number
  if (typeof num==='number') {
    let _ = num
    num = check
    check = (i: number): boolean => i < _
  }

  // Allow interrupt at each step
  let steps = 0

  let i = 0

  if (typeof incr==='number') {
    while (check(i)) {
      arr.push(num(i))
      i+=incr
      if (++steps > maxLoops) break
    }
  } else {
    while (check(i)) {
      arr.push(num(i))
      i = incr(i)
      if (++steps > maxLoops) break
    }
  }

  return arr
}
