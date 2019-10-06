import { contains, toUtf16 } from '../utils'

export { contains }
export * from './math'
export * from './comparison'
export * from './array'

export function size(s) {
  if (typeof s==='undefined') return size
  return Array.isArray(s)
    ? s.length
    : typeof s==='object'
      ? Object.keys(s).length
      : String(s).length
}

export function set(obj, name, value) {

  if (typeof name==='undefined') return (...args) => set(obj, ...args)

  if (typeof obj==='string') {
    // this.local.scope
    this.global.scope[obj] = name
    return name
  }
  if (typeof name==='object') {
    Object.assign(obj, name)
  } else {
    obj[name] = value
  }
  return obj
}

export function unset(obj, name, count = 1) {

  if (typeof name==='undefined') return (...args) => set(obj, ...args)

  if (Array.isArray(obj)) {
    // Remove item by index
    return obj.splice(name, count)
    // Remove item by reference?
  }
  delete obj[name]
  return obj
}

export function get(obj, name) {
  if (typeof obj==='string') {
    return typeof this.local.scope[obj]!=='undefined'
      ? this.local.scope[obj]
      : this.global.scope[obj]
  }
  return obj[name]
}

export function use(name) {
  // Extract all keys from an object into local variables
  // If given a string, it will look for a variable of that name in the global scope
  const obj =
    typeof name==='string'
      ? this.global.scope[name]
      : name
  if (!obj || typeof obj!=='object') return obj
  Object.assign(this.local.scope, obj)
  return obj
}


export function char(val) {
  return toUtf16(val) // parseInt(val, 16)
}