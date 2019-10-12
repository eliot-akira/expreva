
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
    return keys
      .map(function(key, i) {
        return fn(key, arr[key], i)
      })
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
    return keys
      .filter(function(key, i) {
        return fn(arr[key], key, i)
      })
      .map(function(key) {
        return arr[key]
      })
  }

  return arr
}

export function reduce(arr, fn, acc) {

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

// push, pop, insert, slice, search

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
    items.unshift(item).forEach(function(i) {
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

export function insert(arr, index, ...items) {
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

export function slice(arr, start, end) {
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
  if (typeof arr==='string' || arr instanceof Function) {
    var _ = item
    item = arr
    arr = _
  }

  if (Array.isArray(arr)) {
    return arr.indexOf(item)
  }

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
  if (typeof arr==='string') return arr.split()

  if (typeof arr==='object') {
    return Object.values(arr)
  }

  return arr
}

// join, split

export function join(arr, sep) {

  // Curried: join(arr)(sep)
  if (typeof sep==='undefined')  {
    return function(arg) {
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

  // Curried: join(arr)(sep)
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


// TODO: Flexbile loop construct

export function repeat(num, fn) {

  // Curried: repeat(num)(fn)
  if (typeof fn==='undefined')  {
    return function(nextFn) {
      return repeat(num, nextFn)
    }
  }

  // Reversed arguments: repeat(fn, num)
  if (num instanceof Function) {
    let _ = fn
    fn = num
    num = _
  }

  const arr = []

  for (let i=0; i < num; i++) {
    arr.push(fn(i))
  }

  return arr
}
