/**
 * This is a Lisp interpreter based on [miniMAL](https://github.com/kanaka/miniMAL) ported to TypeScript.
 */

import { toString } from '../compile'
import { Environment, RuntimeEnvironment, createEnvironment } from './environment'

export * from './environment'
export type Expression = number | string | boolean | { [key: string]: any } | Expression[]
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

 /**
  * Bind variables to environment for function scope
  */
export const bindFunctionScope = function(
  env: RuntimeEnvironment, // Scope
  args: Expression[],        // Argument definition
  givenArgs: any[]         // Called with arguments
): RuntimeEnvironment {

  const boundEnv = env.create()

  args.forEach((a, i) => a == '&'
    // Spread arguments
    ? boundEnv[
        args[i + 1] as string
      ] = givenArgs.slice(i)
    : (boundEnv[ a as string ] = givenArgs[i])
  )

  return boundEnv
}

export function expandMacro(ast: Expression, env: RuntimeEnvironment): Expression {
  while (ast instanceof Array
    && typeof ast[0]==='string'
    && env[ ast[0] ]
    && env[ ast[0] ].isMacro
  ) {
    ast = env[ ast[0] ](...ast.slice(1))
  }
  return ast
}

export const evaluateExpression = function(ast: Expression, env: RuntimeEnvironment): ExpressionResult {
  return ast instanceof Array                               // List form?
    ? ast.map((...a) => evaluate(a[0] as Expression, env))  // Evaluate list
    : (typeof ast === 'string')                             // Symbol
      ? ast==='env' ? env                                   // Magic symbol for current environment
        : env.propertyIsEnumerable(ast)                     // Symbol in current env (was: ast in env)
          ? env[ ast ]                                      // Lookup symbol
          : env.parent
            ? evaluateExpression(ast, env.parent)           // Recursively look up parent scope
            : Environment.root.propertyIsEnumerable(ast)    // Symbol in default env
              ? Environment.root[ ast ]                     // Lookup symbol
              //: undefined                                 // Undefined
              : env.throw({ message: `Undefined symbol "${ast}"` })
      : ast                                                 // Primitive value: number, boolean, function
}

export function evaluate(ast: Expression, givenEnv?: RuntimeEnvironment): ExpressionResult {

  let env = givenEnv ? givenEnv : createEnvironment()

  while (true) {

    // TODO: Add a check on each "tick" with optional limits (max ops, timeout)

    if (!(ast instanceof Array)) return evaluateExpression(ast, env)
    ast = expandMacro(ast, env)
    if (!(ast instanceof Array)) return evaluateExpression(ast, env)

    switch (ast[0]) {

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

    // List given arguments as array: list(1, 2, x) => [1, 2, 3]
    case 'list':
      return ast.slice(1).map(a => evaluate(a, env))

      // Object from key-value pairs
    case 'obj':
      return ast.slice(1).reduce((obj, pair) => {
        if (pair && pair[0]) {
          const key = typeof pair[0]==='string'
            ? pair[0]
            : evaluate(pair[0], env)
          obj[ key ] = evaluate(pair[1], env)
        }
        return obj
      }, {})

    // Set variable
    case 'def': {
      const varName = ast[1]
      const value = evaluate(ast[2] as Expression, env)
      // Function name
      if (value instanceof Function) {
        Object.defineProperty(value, 'name', {
          value: typeof varName==='string' ? varName : 'anonymous',
          writable: true
        })
      }
      // Set member via get
      if (Array.isArray(varName)) {
        const member = varName.pop()
        varName.push(['def', evaluate(member as Expression, env), ['`', value]])
        ast = varName
        continue
      }
      return env[ varName as string ] = value
    }

    // Get variable or get/set member
    case 'get': {
      const varName = ast[1]
      const members = ast.slice(2)
      const rootValue = evaluate(varName as Expression, env)

      if (!members.length) return rootValue

      if (typeof rootValue!=='object') {
        return env.throw({
          message: 'Cannot access member: not an array or object'
        })
      }

      let value = rootValue
      for (const member of members) {
        // Define member
        if (member[0]==='def') {
          value = (value[ member[1] ] = evaluate(member[2], env))
          break
        }
        const key = evaluate(member as Expression, env)
        if (key instanceof Function) {
          value = key(value)
          continue
        }
        if (typeof key!=='string' && typeof key!=='number'
          || value[key]==null || !value.hasOwnProperty(key)
        ) return
        value = value[key]
      }
      return value
    }

    // Get or set an array or object attribute
    // case '.-': {
    //   const el = evaluateExpression(ast.slice(1), env)
    //   const x = el[0][ el[1] ]
    //   return 2 in el ? (el[0][ el[1] ] = el[2]) : x
    // }

    // // Call object method
    // case '.': {
    //   const el = evaluateExpression(ast.slice(1), env)
    //   const x = el[0][ el[1] ]
    //   return x.apply(el[0], el.slice(2))
    // }

    // Try / Catch
    case 'try':
      try {
        return evaluate(ast[1] as Expression, env)
      } catch (e) {
        return evaluate(ast[2][2], bindFunctionScope(env, [ ast[2][1] ], [e]))
      }

    // Define new function
    case 'λ':
    case 'lambda': {
      const args = Array.isArray(ast[1]) ? ast[1] : []
      const f: Lambda = Object.assign(
        (...givenArgs: any) => evaluate(
          ast[2] as Expression,
          bindFunctionScope(env, args, givenArgs)
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
            return toString(def) // f.name ? ['def', f.name, def] :
          }
        }
      )
      return f
    }

    // Tail-call optimization cases

    // New environment with bindings
    case 'let':
      if (!ast[1] || !Array.isArray(ast[1])) return
      env = env.create()
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
        ast = f.lambda.body
        env = bindFunctionScope(f.lambda.scope, f.lambda.args, el.slice(1))
        continue
      }
      // Function in environment
      return f(...el.slice(1))
    }

    return f
  }
}