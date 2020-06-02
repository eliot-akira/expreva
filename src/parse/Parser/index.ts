/**
 * Parser based on https://github.com/gliese1337/PrattParser.js
 */

import {
  Token,
  Parselet,
  PrefixParselet,
  XfixParselet,
  IXfixParselet,
  PrefixUnaryParselet,
  PostfixUnaryParselet,
  BinaryParselet,
  ExpressionParserInterface,
} from './parselets'

export {
  PrefixParselet,
  XfixParselet,
  PrefixUnaryParselet,
  PostfixUnaryParselet,
  BinaryParselet,
}

export type {
  Token,
  Parselet,
  IXfixParselet,
  ExpressionParserInterface,
}

class ExpressionParser<N, T extends Token> implements ExpressionParserInterface<N, T> {

  private g: Iterator<T>
  private q: T[] = []

  public stack: T[] = []
  public lastKnownToken

  constructor(
    private prefixParselets: Map<string, PrefixParselet<N, T>>,
    private xfixParselets:  Map<string, XfixParselet<N, T>>,
    tokens: Iterable<T>,
    private interpreter?: (node: N) => N,
  ) {
    this.g = tokens[Symbol.iterator]()
  }

  peek(d: number): T | undefined {
    while(d >= this.q.length) {
      this.q.push(this.g.next().value)
    }
    return this.q[d]
  }

  consume(expect?: string): T {
    const t = this.q.length ? this.q.shift() : this.g.next().value

    if (expect) {
      if (!t) throw new Error(`Unexpected end of input expected ${ expect }`)
      if (t.type !== expect) throw new Error(`Unexpected ${ t.type } token - expected ${ expect }`)
    } else {
      if (!t) throw new Error(`Unexpected end of input`)
    }

    if (t) this.lastKnownToken = t

    return t
  }

  match(expect: string): boolean {
    const t = this.peek(0)

    if (!t || t.type !== expect) return false

    this.q.shift()

    return true
  }

  private get precedence() {
    const next = this.peek(0)
    if (!next) return 0
    const parser = this.xfixParselets.get(next.type)
    if (!parser) return 0

    return parser.precedence
  }

  parse(precedence: number) {

    let left

    if ( this.stack[0] ) {
      left = this.stack.pop()
    } else {
      const token = this.consume()
      const prefix = this.prefixParselets.get(token.type)
      if (!prefix) throw token

      left = prefix.parse(this, token)

      if (this.stack[0]) return left
    }

    const { interpreter: interp } = this
    if (interp == null) {
      while(precedence < this.precedence) {

        const token = this.consume()
        const xfix = this.xfixParselets.get(token.type)
        if (!xfix) throw token
        left = xfix.parse(this, token, left)

        if (this.stack[0]) break
      }
      return left
    }

    // With interpreter

    left = interp(left)

    while(precedence < this.precedence) {
      const token = this.consume()
      const xfix = this.xfixParselets.get(token.type)
      if (!xfix) throw token
      left = interp(xfix.parse(this, token, left))
      if (this.stack[0]) break
    }

    return left
  }
}

export class Parser<N, T extends Token> {
  private prefixParselets = new Map<string, Parselet<N, T>>()
  private xfixParselets = new Map<string, IXfixParselet<N, T>>()

  public readonly PREFIX = true
  public readonly XFIX = false

  public readonly RIGHT_ASSOCIATIVE = true
  public readonly LEFT_ASSOCIATIVE = false

  public register(tokenType: string, parselet: Parselet<N, T>, prefix?: boolean) {
    if (prefix === void 0) {
      if (parselet instanceof PrefixParselet) {
        this.prefixParselets.set(tokenType, parselet)
      } else if (parselet instanceof XfixParselet) {
        this.xfixParselets.set(tokenType, parselet)
      } else {
        throw new Error("Cannot determine parselet type.")
      }
      return this
    }

    if (prefix) {
      this.prefixParselets.set(tokenType, parselet)
    } else{
      if (parselet.hasOwnProperty('precedence')) {
        this.xfixParselets.set(tokenType, parselet as IXfixParselet<N, T>)
      } else {
        throw new Error("Xfix operators must specify precedence")
      }
    }

    return this
  }

  public nullary(tokenType: string, cons: (token: T) => N) {
    return this.register(tokenType, { parse: (_, token) => cons(token) }, true)
  }

  public prefix(tokenType: string, precedence: number, cons: (token: T, right: N) => N) {
    return this.register(tokenType, new PrefixUnaryParselet(cons, precedence))
  }

  public postfix(tokenType: string, precedence: number, cons: (token: T, left: N) => N) {
    return this.register(tokenType, new PostfixUnaryParselet(cons, precedence))
  }

  public infix(tokenType: string, precedence: number, associativity: boolean, cons: (token: T, left: N, right: N) => N) {
    return this.register(tokenType, new BinaryParselet(cons, precedence, associativity))
  }

  public peek(num?: number) {
    return this.parser && (this.parser.peek(num) || this.parser.lastKnownToken)
  }

  public parse(tokens: Iterable<T>, interpreter?: (node: N) => N) {

    if (!tokens || !tokens[Symbol.iterator] || tokens.peek().isEof()) return []

    const expressions = []
    const parser = this.parser = new ExpressionParser(this.prefixParselets, this.xfixParselets, tokens, interpreter)

    let expression

    while (expression = parser.parse(0)) {
      expressions.push(expression)
      if (!parser.peek(0)) break
    }

    return expressions
  }
}