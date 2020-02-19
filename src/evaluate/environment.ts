
export type RuntimeEnvironment = Environment & EnvironmentProps

export type EnvironmentProps = {
  [key: string]: any // Any variable value, function, or expression
}

export class Environment {

  // See bottom of file for definition
  static root: RuntimeEnvironment
  // Top scope for all child scopes
  readonly global?: RuntimeEnvironment

  constructor(props?: EnvironmentProps, global?: RuntimeEnvironment | false) {
    if (global!==false) {
      Object.defineProperty(this, 'global', {
        value: global || this,
        enumerable: false,
        writable: false
      })
    }
    if (!props) return
    Object.keys(props).forEach(key => {
      this[key] = props[key] instanceof Function
        ? props[key].bind(this)
        : props[key]
    })
  }

  throw(error: any) {
    throw new RuntimeError(error.message, error)
  }

  /**
   * Create child scope with parent and global as non-enumerable properties.
   * Symbols in parent scopes are looked up recursively in evaluateExpression.
   */
  create(props?: EnvironmentProps) {

    // Root scope: create top scope with no parent
    if (!this.global) return new Environment(props)

    const env = new Environment(props, this.global)
    Object.defineProperty(env, 'parent', {
      value: this,
      enumerable: false,
      writable: false
    })
    return env
  }
}

/**
 * Error with data property
 *
 * TODO: Stack trace to source location
 */
export class RuntimeError extends Error {
  constructor(public message: string, public data?: any) {
    super(message)
  }
}

Environment.root = new Environment({
  true: true,
  false: false,

  '+': (a: number = 0, b: number = 0): number => a + b,
  '-': (a: number = 0, b: number = 0): number => a - b,
  '*': (a: number = 1, b: number = 1): number => a * b,
  '/': (a: number = 0, b: number = 1): number => a / b,

  '!': (a: any): boolean => !a,
  '||': (a: any, b: any): boolean => a || b,
  '&&': (a: any, b: any): boolean => a && b,

  '==': (a: any, b: any): boolean => a === b,
  '!=': (a: any, b: any): boolean => a !== b,

  '<': (a: any, b: any): boolean => a < b,
  '<=': (a: any, b: any): boolean => a <= b,
  '>': (a: any, b: any): boolean => a > b,
  '>=': (a: any, b: any): boolean => a >= b,

  map: (fn: (value: any, index: number | string) => any) =>
    (arr: any[] | { [key: string]: any }) =>
      Array.isArray(arr) ? arr.map(fn) : (Object.keys(arr).reduce((obj, key) => {
        obj[key] = fn(key, arr[key])
        return obj
      }, {})),

  join: (separator: string | any[] | { [key: string]: any }) =>
    (target: any[] | { [key: string]: any }) =>
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
  print: (...args: any) => {
    console.log(...args.map(a => a instanceof Function ? a.toString() : a))
  }
} as EnvironmentProps, false)

export const createEnvironment = (props?: EnvironmentProps): Environment =>
  Environment.root.create(props)
