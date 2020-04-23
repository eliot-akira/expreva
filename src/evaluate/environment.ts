import rootEnvironment from './rootEnvironment'

export type RuntimeEnvironment = Environment & EnvironmentProps

export type EnvironmentProps = {
  [key: string]: any // Any variable value, function, or expression
}

export class Environment {

  // Root environment is immutable and provides built-in functions
  static root: RuntimeEnvironment = new Environment(
    rootEnvironment as EnvironmentProps,
    false
  )

  // Global scope
  readonly global?: RuntimeEnvironment
  // Parent scope
  readonly parent?: RuntimeEnvironment

  constructor(props?: EnvironmentProps, global?: RuntimeEnvironment | false) {
    if (global!==false) {
      Object.defineProperty(this, 'global', {
        value: global || this,
        enumerable: false,
        writable: false
      })
      if (!this.global.root) {
        Object.defineProperty(this.global, 'root', {
          value: Environment.root,
          enumerable: false,
          writable: false
        })
      }
    }
    if (!props) return
    Object.keys(props).forEach(key => {
      (this as any)[key] = props[key] instanceof Function
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
  create(props?: EnvironmentProps): RuntimeEnvironment {

    // Root scope has no parent
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

export const createEnvironment = (props?: EnvironmentProps): RuntimeEnvironment =>
  Environment.root.create(props)
