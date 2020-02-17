/**
 * This is a Lisp interpreter based on [miniMAL](https://github.com/kanaka/miniMAL) ported to TypeScript.
 */

import { toString } from './compile'

export type Atom = number | string | boolean | { [key: string]: any } | Atom[]
export type Expression =  Atom[]
export type SyntaxTree = Expression

export type ExpressionResult = any

export interface Lambda {
  (...args: any[]): any
  lambda: LambdaProps
}

export type LambdaProps = {
  args: Expression,
  body: Expression,
  scope: RuntimeEnvironment,
}

export type EnvironmentProps = {
  [key: string]: any // Any variable value, function, or expression
}

export class Environment {

  // See bottom of file for definition
  static baseEnv: RuntimeEnvironment

  constructor(props?: EnvironmentProps) {
    if (!props) return
    Object.keys(props).forEach(key => {
      this[key] = props[key] instanceof Function
        ? props[key].bind(this)
        : props[key]
    })
  }

  clone() {
    return new Environment(this)
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
export const bindFunctionScope = function(
  env: RuntimeEnvironment,
  ast: SyntaxTree,  // Argument definition
  exprs: Expression // Called with arguments
): RuntimeEnvironment {

  const boundEnv = env.clone()

  ast.some((a, i) => a == '&'
    // Spread arguments
    ? boundEnv[ ast[i + 1] as string ] = exprs.slice(i)
    : (boundEnv[ a as string ] = exprs[i], 0))

  return boundEnv
}

export const evaluateExpression = function(ast: SyntaxTree, env: RuntimeEnvironment): ExpressionResult {
  return ast instanceof Array                               // List
    ? ast.map((...a) => evaluate(a[0] as Expression, env))  // Evaluate list
    : (typeof ast == 'string')                              // Symbol
      ? ast==='env'
        ? env                                               // Current environment
        : ast in env                                        // Symbol in current env
          ? env[ ast ]                                      // Lookup symbol
          : ast in Environment.baseEnv                      // Symbol in default env
            ? Environment.baseEnv[ ast ]                    // Lookup symbol
            : undefined                                     // Undefined
            // env.throw({ message: `Undefined symbol "${ast}"` })
      : ast
}

export function expandMacro(ast: SyntaxTree, env: RuntimeEnvironment): SyntaxTree {
  while (ast instanceof Array
    && typeof ast[0]==='string'
    && env[ ast[0] ]
    && env[ ast[0] ].isMacro
  ) {
    ast = env[ ast[0] ](...ast.slice(1))
  }
  return ast
}

export function evaluate(ast: SyntaxTree, givenEnv?: RuntimeEnvironment): ExpressionResult {

  let env = givenEnv ? givenEnv : Environment.baseEnv

  while (true) {

    // TODO: Add a check on each "tick" with optional limits (max ops, timeout)

    if (!(ast instanceof Array)) return evaluateExpression(ast, env)
    ast = expandMacro(ast, env)
    if (!(ast instanceof Array)) return evaluateExpression(ast, env)

    switch (ast[0]) {

    // Define a variable in environment
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

    // Quote expression unevaluated
    case '`':
    case 'expr': return ast[1]

    // Evaluate quoted expression
    case 'eva':
      ast = evaluate(ast[1] as Expression, env)
      continue

    // List given arguments as array: list(1, 2, 3) => [1, 2, 3]
    case 'list':
      return ast.slice(1) as Expression

    // Get or set an array or object attribute
    case '.-': {
      const el = evaluateExpression(ast.slice(1), env)
      const x = el[0][ el[1] ]
      return 2 in el ? el[0][ el[1] ] = el[2] : x
    }

    // Call object method
    case '.': {
      const el = evaluateExpression(ast.slice(1), env)
      const x = el[0][ el[1] ]
      return x.apply(el[0], el.slice(2))
    }

    // Try / Catch
    case 'try':
      try {
        return evaluate(ast[1] as Expression, env)
      } catch (e) {
        return evaluate(ast[2][2], bindFunctionScope(env, [ ast[2][1] ], [e]))
      }

    // Define new function
    case 'lambda': {

      const f: Lambda = Object.assign(
        (...args: any) => evaluate(
          ast[2] as Expression,
          bindFunctionScope(env, ast[1] as Expression, args)
        ),
        {
          lambda: {
            args: ast[1] as Expression,  // Argument definition
            body: ast[2] as Expression,  // Function body
            scope: env,                  // Function scope
          } as LambdaProps,

          // Print definition
          toString() {
            const def = ['lambda', ast[1], ast[2]]
            return toString(f.name ? ['def', f.name, def] : def)
          }
        }
      )
      return f
    }

    // Tail-call optimization cases

    // New environment with bindings
    case 'let':
      if (!ast[1] || !Array.isArray(ast[1])) return
      env = env.clone()
      ;(ast[1] as []).forEach((value, i) => {
        if (i % 2) {
          env[ ast[1][ i - 1 ] ] = evaluate(value, env)
        }
      })
      ast = ast[2] as Expression
      continue

    // Multiple forms for side-effects
    case 'do':
      const last = ast.length-1
      if (last===0) return // No arguments

      evaluateExpression(ast.slice(1, last), env)

      // Tail
      ast = ast[ last ] as Expression
      continue

    // Conditional branches
    case 'if':
      if (ast[1]==null) return env.throw({
        message: 'No condition for if'
      })
      if (ast[2]==null) return env.throw({
        message: 'No true branch for if'
      })
      if (ast[3]==null) {
        // No else branch
        if (!evaluate(ast[1] as Expression, env)) return
        ast = ast[2] as Expression
        continue
      }
      ast = (evaluate(ast[1] as Expression, env) ? ast[2] : ast[3]) as Expression
      continue
    }

    // Invoke list form

    const el = evaluateExpression(ast, env)
    const f = el instanceof Function ? el : el[0]
    if (f==null) return

    if (Array.isArray(f) && f[0]==='lambda') {
      // Function in environment defined as list form
      ast = f[2]
      env = bindFunctionScope(env, f[1], el.slice(1))
      continue
    }

    if (f instanceof Function) {
      // Lambda
      if (f.lambda) {
        ast = f.lambda.body       // Function body
        env = bindFunctionScope(
          f.lambda.scope,         // Function scope
          f.lambda.args,          // Argument definition
          el.slice(1)             // Called with arguments
        )
        continue
      }
      // Function in environment
      return f(...el.slice(1))
    }

    return f
  }
}

export const createEnvironment = (env: EnvironmentProps = {}): Environment => new Environment(env)

Environment.baseEnv = createEnvironment({
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

  map: (arr: any[], fn: (value: any, index?: number) => any) => arr.map(fn),

  throw(error: any) {
    throw new RuntimeError(error.message, error)
  },

  print: (...args: any) => {
    console.log(...args.map(a => a instanceof Function ? a.toString() : a))
  }
} as EnvironmentProps)
