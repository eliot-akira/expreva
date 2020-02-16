/**
 * This is a Lisp interpreter based on [miniMAL](https://github.com/kanaka/miniMAL) ported to TypeScript.
 */

export type Atom = number | string | Atom[]
export type Expression =  Atom[]
export type SyntaxTree = Expression

export type ExpressionResult = any

export interface Lambda {
  (...args: any[]): any
  ast: LambdaProps
}

export type LambdaProps = [Expression, RuntimeEnvironment, Expression]

export type EnvironmentProps = {
  [key: string]: any // Any variable value, function, or expression
}


export class Environment {

  // See bottom of file for core definitions
  static core: EnvironmentProps = {}
  static defaultEnv: RuntimeEnvironment

  private envProps: EnvironmentProps

  constructor(givenEnv?: EnvironmentProps) {

    const props = Object.assign({}, Environment.core, givenEnv || {})

    Object.keys(props).forEach(key => {
      this[key] = props[key] instanceof Function
        ? props[key].bind(this)
        : props[key]
    })

    this.envProps = props
  }

  clone() {
    return new Environment(this.envProps)
  }
}

export type RuntimeEnvironment = Environment & EnvironmentProps

/**
 * Error with data property
 *
 * TODO: Stack trace
 */
export class RuntimeError extends Error {
  constructor(public message: string, public data?: any) {
    super(message)
  }
}

 /**
  * Bind variables to environment for function scope
  */
export const bindEnv = function(ast: SyntaxTree, env: RuntimeEnvironment, exprs: Expression): RuntimeEnvironment {

  const boundEnv = env.clone()

  ast.some((a, i) => a == '&' ? boundEnv[ ast[i + 1] as string ] = exprs.slice(i)
    : (boundEnv[ a as string ] = exprs[i], 0))

  return boundEnv
}

export const evaluateExpression = function(ast: SyntaxTree, env: RuntimeEnvironment): ExpressionResult {

  return ast instanceof Array                               // List?
    ? ast.map((...a) => evaluate(a[0] as Expression, env))  // List
    : (typeof ast == 'string')                              // Symbol?
      ? ast in env                                          // Symbol in env?
        ? env[ast]                                          // Lookup symbol
        : env.throw({
          message: `Undefined symbol "${ast}"`              // Undefined symbol
        })
      : ast                                                 // Unchanged
}

export function expandMacro(ast: SyntaxTree, env: RuntimeEnvironment): SyntaxTree {
  while (ast instanceof Array
    && !Array.isArray(ast[0])
    && ast[0] in env
    && env[ast[0]].isMacro
  ) {
    ast = env[ast[0]](...ast.slice(1))
  }
  return ast
}

export function evaluate(ast: SyntaxTree, givenEnv?: RuntimeEnvironment): ExpressionResult {

  let env = givenEnv ? givenEnv : Environment.defaultEnv

  while (true) {

    if (!(ast instanceof Array)) return evaluateExpression(ast, env)

    ast = expandMacro(ast, env)

    if (!(ast instanceof Array)) return evaluateExpression(ast, env)

    switch (ast[0]) {

    // Set a variable in current environment
    case 'set':
    case 'def': {
      const varName = ast[1] as string
      const value = evaluate(ast[2] as Expression, env)
      if (value instanceof Function) {
        Object.defineProperty(value, 'name', {
          value: varName || 'anonymous',
          writable: true
        })
      }
      return env[ varName ] = value
    }
    // Mark as macro
    case '~':
    case 'macro':
      let f = evaluate(ast[1] as Expression, env) // Evaluates to regular function
      f.isMacro = true // mark as macro
      return f

    // Quote (unevaluated)
    case '`':
    case 'expr': return ast[1]

    // Get or set an array or object attribute
    case '.-': {
      const el = evaluateExpression(ast.slice(1), env)
      const x = el[0][ el[1] ]
      return 2 in el ? el[0][ el[1] ] = el[2] : x
    }

    // Call object method
    case '.': {
      const el = evaluateExpression(ast.slice(1), env)
      const x = el[0][el[1]]
      return x.apply(el[0], el.slice(2))
    }

    // Try / Catch
    case 'try':
      try {
        return evaluate(ast[1] as Expression, env)
      } catch (e) {
        return evaluate(ast[2][2], bindEnv([ ast[2][1] ], env, [e]))
      }

    // Define new function
    case 'lambda': {
      const f: Lambda = Object.assign(
        (...args: any) =>
          evaluate(ast[2] as Expression, bindEnv(ast[1] as Expression, env, args))
        ,
        {
          ast: [ast[2] as Expression, env, ast[1] as Expression] as LambdaProps
        }
      )
      return f
    }

    // Tail-call optimization cases

    // New environment with bindings
    case 'let':

      env = env.clone()

      ;(ast[1] as []).forEach((value, i) => {
        if (i % 2) {
          env[ ast[1][ i - 1 ] ] = evaluate(value, env)
        }
      })

      ast = ast[2] as Expression
      continue // while(true)

    // Multiple forms for side-effects
    case 'do':
      const last = ast.length-1
      if (last===0) return // No arguments

      evaluateExpression(ast.slice(1, last), env)

      // Tail
      ast = ast[ last ] as Expression
      continue // while(true)

    // Conditional branches
    case 'if':
      if (!ast[1]) return env.throw({
        message: 'No condition for if'
      })
      if (!ast[2]) return env.throw({
        message: 'No true branch for if'
      })
      if (!ast[3]) {
        // No else branch
        if (!evaluate(ast[1] as Expression, env)) return
        ast = ast[2] as Expression
        continue // while(true)
      }
      ast = (evaluate(ast[1] as Expression, env) ? ast[2] : ast[3]) as Expression
      continue // while(true)
    }

    // Invoke list form

    const el = evaluateExpression(ast, env)
    const f = el[0]
    if (f==null) return

    if (Array.isArray(f) && f[0]==='fn') {
      // Function in environment defined as list form
      ast = f[2]
      env = bindEnv(f[1], env, el.slice(1))
      continue
    }

    if (f.ast) {
      ast = f.ast[0]
      env = bindEnv(f.ast[2], f.ast[1], el.slice(1))
      continue
    }

    if (f instanceof Function) {
      return f(...el.slice(1))
    }

    return // Return self? el
  }
}

export const createEnvironment = (env: EnvironmentProps = {}): Environment => new Environment(env)

Environment.core = {
  true: true,
  false: false,

  '+': (a: number, b: number): number => a + b,
  '-': (a: number, b: number): number => a - b,
  '*': (a: number, b: number): number => a * b,
  '/': (a: number, b: number): number => a / b,

  '==': (a: any, b: any): boolean => a === b,
  '!=': (a: any, b: any): boolean => a !== b,
  '<': (a: any, b: any): boolean => a < b,
  '<=': (a: any, b: any): boolean => a <= b,
  '>': (a: any, b: any): boolean => a > b,
  '>=': (a: any, b: any): boolean => a >= b,

  list: (...args: any[]) => args, // ['fn', ['&', 'a'], 'a']
  map: (arr: any[], fn: (value: any, index?: number) => any) => arr.map(fn),

  eva(ast: Expression) {
    return evaluate(ast, this)
  },

  throw(error: any) {
    throw new RuntimeError(error.message, error)
  },

  print: (...args: any) => {
    for (const arg of args) {
      console.log(arg)
    }
  }
}

Environment.defaultEnv = createEnvironment()
