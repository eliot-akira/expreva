export default {
  true: true,
  false: false,
  nil: null,

  '+': (a: number = 0, b: number = 0): number => a + b,
  '-': (a: number = 0, b: number = 0): number => a - b,
  '*': (a: number = 1, b: number = 1): number => a * b,
  '/': (a: number = 0, b: number = 1): number => a / b,
  '^': (a: number = 0, b: number = 0): number => Math.pow(a, b),

  '!': (a: any): boolean => !a,
  '||': (a: any, b: any): boolean => a || b,
  '&&': (a: any, b: any): boolean => a && b,

  '==': (a: any, b: any): boolean =>
    // undefined == nil
    a==null && b==null ? true : a === b,
  '!=': function(a: any, b: any): boolean {
    return !this['=='](a,b) //  a !== b
  },

  '<': (a: any, b: any): boolean => a < b,
  '<=': (a: any, b: any): boolean => a <= b,
  '>': (a: any, b: any): boolean => a > b,
  '>=': (a: any, b: any): boolean => a >= b,

  map: (arr: string | any[] | { [key: string]: any }) =>
    (fn: (value: any, index: number | string) => any) =>
      typeof arr==='string' ? (arr.split('')).map(fn)
      : Array.isArray(arr) ? arr.map(fn) // Array: value, index
        : (Object.keys(arr).reduce((obj: { [key: string]: any }, key) => {
          obj[key] = fn(key, arr[key]) // Object: key, value
          return obj
        }, {})),

  join: (target: any[] | { [key: string]: any }) =>
    (separator: string | any[] | { [key: string]: any }) =>
      Array.isArray(target)
        ? (typeof separator==='string')
          ? target.join(separator)
          : Array.isArray(separator)
            ? target.concat(separator)
            : (target.push(separator) && target)
        : typeof target==='string'
          ? target + separator // Assume two strings
          : typeof separator==='string'
            ? Object.keys(target).map(key => target[key]).join(separator)
            : Object.assign(target, separator) // Assume two objects
  ,

  size: (arr: string | any[] | { [key: string]: any }) =>
    Array.isArray(arr) || typeof arr==='string'
      ? arr.length
      : Object.keys(arr).length
  ,

  search: (arr: string | any[] | { [key: string]: any }) =>
    (target: any) =>
      (Array.isArray(arr) || typeof arr==='string')
      ? arr.indexOf(target)
      : Object.keys(arr).filter(key => arr[key]===target)[0]
  ,

  push: (arr: any[]) => (target: any) => arr.push(target) && arr,
  pop: (arr: any[]) => arr.pop(),
  insert: (arr: any[]) => (index: number, target: any) => {
    arr.splice(index, 0, target)
    return arr
  },
  slice: (arr: any[]) => (start: number, end?:number) => arr.slice(start, end),
  filter: (arr: any[]) => (callback: (arr: any[]) => boolean) => arr.filter(callback),
  reduce: (arr: any[]) => (reducer: (value: any, acc: any) => any, acc: any) => arr.reduce(reducer, acc),

  keys: (obj: { [key: string]: any }) => Object.keys(obj),

  set: (obj: { [key: string]: any }) =>
    (key: string | { [key: string]: any }, value?: any) => {
      if (typeof key==='object') {
        Object.assign(obj, key)
      } else {
        obj[ key ] = value
      }
      return obj
    }
  ,
  unset: (obj: { [key: string]: any }) =>
    (key: string) => {
      delete obj[key]
      return obj
    }
  ,
  print: (...args: any) => {
    console.log(...args.map(a => a instanceof Function ? a.toString() : a))
  }
}