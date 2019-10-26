import {
  Token, TokenType, TokenValue,
  TOP,
  TNUMBER,
  TSTRING,
  TPAREN,
  TBRACKET,
  TCOMMA,
  TNAME,
  TSEMICOLON,
  TEOF,
} from './token'
import {
  Instruction,
  INUMBER,
  IVAR,
  IVARNAME,
  IVARNAME_MEMBER,

  IFUNDEF,
  IFUNDEFANON,
  IFUNCALL,
  IFUNAPPLY,
  IEXPR,
  IMEMBER,
  IARRAY,
  IOBJECT,
  IENDSTATEMENT,

  IOP1,
  IOP2,

  ternaryInstruction,
  binaryInstruction,
  unaryInstruction
} from './instruction'
import { contains } from './utils'
import tokenize, { Tokenizer } from './tokenize'

import { Source, Instructions } from './types'

const COMPARISON_OPERATORS = ['==', '!=', '<', '<=', '>=', '>', 'in']
const ADD_SUB_OPERATORS = ['+', '-']
const TERM_OPERATORS = ['*', '/', '%']
const COMPOUND_ASSINGMENT_OPERATORS = ['+=', '-=', '*=', '/=', '++', '--']

type TokenChecker = (token: Token) => boolean
type TokenValueChecker = TokenValue | TokenValue[] | TokenChecker

const EmptyToken = {
  type: null,
  value: null
}

export default function parse(source: Source) {
  const parser = new Parser(tokenize(source))
  return parser.parse()
}

export class Parser {

  tokens: Tokenizer
  current: Token | typeof EmptyToken
  nextToken: Token | typeof EmptyToken
  savedCurrent: Token | typeof EmptyToken
  savedNextToken: Token | typeof EmptyToken
  instructions: Instructions

  constructor(tokenizer) {
    this.tokens = tokenizer
    this.current = EmptyToken
    this.nextToken = EmptyToken
    this.next()
    this.savedCurrent = EmptyToken
    this.savedNextToken = EmptyToken
    this.instructions = []
  }

  // Start here
  parse() {
    this.instructions = []
    while(!this.accept(TEOF)) {
      this.parseExpressions(this.instructions)
      if (!this.check(TEOF)) {
        this.instructions.push(new Instruction(IENDSTATEMENT, TSEMICOLON))
      }
    }
    return this.instructions
  }

  err(message: string) {
    const coords = this.tokens.getCoordinates()
    const e = new Error(
      `Parse error on line ${coords.line}, column ${coords.column}: ${message}`
    ) as Error & { instructions: Instructions }

    // Pass partially tokenized instructions on parse error
    e.instructions = this.instructions
    throw e
  }

  next() {
    this.current = this.nextToken
    return (this.nextToken = this.tokens.next())
  }

  tokenMatches(token: Token, value?: TokenValueChecker) {
    if (typeof value === 'undefined') {
      return true
    }
    if (Array.isArray(value)) {
      return contains(value, token.value)
    }
    if (typeof value === 'function') {
      return value(token)
    }
    return token.value === value
  }

  save() {
    this.savedCurrent = this.current
    this.savedNextToken = this.nextToken
    this.tokens.save()
  }

  restore() {
    this.tokens.restore()
    this.current = this.savedCurrent
    this.nextToken = this.savedNextToken
  }

  check(type: TokenType, value?: TokenValueChecker) {
    return this.nextToken && this.nextToken.type === type && this.tokenMatches(this.nextToken, value)
  }

  hasNextToken() {
    return this.nextToken && this.nextToken.type !== TEOF
  }

  accept(type: TokenType, value?: TokenValueChecker) {
    if (this.check(type, value)) {
      this.next()
      return true
    }
    return false
  }

  expect(type: TokenType, value?: TokenValueChecker) {
    if (this.accept(type, value)) return true
    return this.err(
      `Expected ${
        type + (value ? ` "${value}"` : '')
      } but got ${
        (this.nextToken && (this.nextToken.type + (
          this.nextToken.value ? ` "${this.nextToken.value}"` : ''))) || 'undefined'
      }`
    )
  }

  validateStartOfExpression() {
    if (this.accept(TPAREN, ')')) return this.err('Unexpected token ")"')
    if (this.accept(TBRACKET, '}')) return this.err('Unexpected token "}"')
    if (this.accept(TBRACKET, ']')) return this.err('Unexpected token "]"')
    if (this.accept(TCOMMA)) return this.err('Unexpected token ","')
    this.validateEndOfExpression()
  }

  validateEndOfExpression() {
    if (this.accept(TOP, '.')) return this.err('Unexpected token "."')
    if (this.accept(TOP, '=')) return this.err('Unexpected token "="')
    if (this.accept(TOP, '->')) return this.err('Unexpected token "->"')
    if (this.accept(TOP, '?')) return this.err('Unexpected token "?"')
    if (this.accept(TOP, ':')) return this.err('Unexpected token ":"')
  }

  isEndOfExpression() {
    return !this.hasNextToken()
      || this.nextToken.type===TSEMICOLON
      || this.nextToken.type===TCOMMA
      || (this.nextToken.type === TPAREN && this.nextToken.value === ')')
      || (this.nextToken.type === TBRACKET &&
        (this.nextToken.value === '}' || this.nextToken.value === ']')
      )
      || (this.nextToken.type === TOP && (
        this.nextToken.value === '->'
      ))
  }

  parseAtom(instr) {
    if (this.accept(TNAME)) {
      return instr.push(new Instruction(IVAR, this.current.value))
    }
    if (this.accept(TNUMBER)) {
      return instr.push(new Instruction(INUMBER, this.current.value))
    }
    if (this.accept(TSTRING)) {
      return instr.push(new Instruction(INUMBER, this.current.value))
    }
    if (this.accept(TEOF)) return

    if (!this.parseInnerExpressions(instr)) {
      this.err('Unexpected ' + this.nextToken)
      return
    }
  }

  parseExpressions(instr) {
    if (this.parseSpreadOperator(instr)) return
    this.validateStartOfExpression()
    this.parseExpression(instr)
    this.validateEndOfExpression()
    this.parseNextStatement(instr)
  }

  parseExpression(instr) {
    if (this.parseArray(instr)) return
    if (this.parseObject(instr)) return
    if (this.isEndOfExpression()) return //  || this.parseNextStatement(instr)
    this.parseAssignment(instr)
  }

  parseNextStatement(instr) {
    if (!this.accept(TSEMICOLON)) return false
    if (!this.isEndOfExpression()) {
      instr.push(new Instruction(IENDSTATEMENT))
      this.parseExpressions(instr)
    }
    return true
  }

  parseInnerExpressions(instr) {

    this.validateStartOfExpression()

    if (!this.accept(TPAREN, '(')) return false
    if (this.accept(TPAREN, ')')) return true // Empty is valid

    // Possible argument list for an anomymous function
    const firstExpr = []
    this.parseExpressions(firstExpr)
    if (firstExpr.length===1) instr.push(...firstExpr)
    else instr.push(new Instruction(IEXPR, firstExpr))

    if (this.accept(TPAREN, ')')) return true

    const expr = instr.pop()
    const exprInstr = [expr]

    if (expr.type!==IVAR && expr.type!==IEXPR) {
      instr.push(exprInstr.pop())
      if (!this.isEndOfExpression()) {
        instr.push(new Instruction(IENDSTATEMENT))
      }
    }

    if (!this.hasNextToken()) this.err("Unexpected end of expression")

    do {

      if (this.accept(TPAREN, ')')) break

      if (this.accept(TCOMMA)) {
        this.parseExpressions(exprInstr)
      } else if (!this.isEndOfExpression()) {
        exprInstr.push(new Instruction(IENDSTATEMENT))
        this.parseExpressions(exprInstr)
      }
    } while (this.hasNextToken())

    instr.push(new Instruction(IEXPR, exprInstr))
    this.parseAnonymousFunction(instr)
    return true
  }


  parseArray(instr) {
    if (!this.accept(TBRACKET, '[')) return false
    if (!this.hasNextToken()) this.err("Unexpected end of array: missing \"]\"")

    let argCount = 0

    if (!this.accept(TBRACKET, ']') && this.hasNextToken()) {
      do {
        if (!this.parseSpreadOperator(instr)) {
          this.parseExpressions(instr)
        }
        argCount++
      } while (this.accept(TCOMMA))

      this.expect(TBRACKET, ']')
    }

    instr.push(new Instruction(IARRAY, argCount))

    if (this.accept(TOP, '+')) {
      this.parseExpression(instr)
      instr.push(binaryInstruction('+'))
    } else {
      this.parseMemberOfExpression(instr)
    }

    return true
  }

  parseSpreadOperator(instr) {
    if (!this.accept(TOP, '...')) return false
    this.parseExpression(instr)
    instr.push(unaryInstruction('...'))
    return true
  }

  parseObject(instr) {
    if (!this.accept(TBRACKET, '{')) return
    if (!this.hasNextToken()) this.err("Unexpected end of object: missing \"}\"")

    let keyValuePairCount = 0

    if (!this.accept(TBRACKET, '}') && this.hasNextToken()) {

      const pairs: Instructions[] = []
      do {
        const pair: Instructions = []
        if (!this.parseKeyValuePair(pair)) continue
        keyValuePairCount++
        pairs.unshift(pair) // Expected order to key/value pairs
      } while (this.accept(TCOMMA))

      for (const pair of pairs) {
        instr.push(...pair)
      }

      this.expect(TBRACKET, '}')
    }

    instr.push(new Instruction(IOBJECT, keyValuePairCount))

    if (this.accept(TOP, '+')) {
      this.parseObject(instr)
      instr.push(binaryInstruction('+'))
      return true
    }

    this.parseMemberOfExpression(instr)

    return true
  }

  parseKeyValuePair(instr: Instructions) {
    if (this.parseSpreadOperator(instr)) return true

    // Key

    if (this.accept(TNAME) || this.accept(TNUMBER) || this.accept(TSTRING)) {

      instr.push(new Instruction(INUMBER, this.current.value))

    } else if (this.accept(TPAREN, '(')) {

      const exprInstr = []

      this.parseExpressions(exprInstr)
      this.expect(TPAREN, ')')
      instr.push(new Instruction(IEXPR, exprInstr))

    } else {
      return false
    }

    // Value

    if (this.accept(TOP, ':')) {
      this.parseExpressions(instr)
      return true
    }

    // { var } becomes { var: var }
    const key = instr.pop()
    if (key) instr.push(key, new Instruction(IVAR, key.value))

    return true
  }


  parseAnonymousFunction(instr) {

    if (!this.accept(TOP, '=>')) return false

    // Function body
    const funcInstr = []
    this.parseExpression(funcInstr)

    // Function arguments
    let arg = instr.pop()
    let argCount = 0
    if (!arg) {
      // ()
    } else if (arg.type===IVAR) {
      argCount = 1
      instr.push(new Instruction(IVARNAME, arg.value))
    } else if (arg.type===IEXPR) {

      // Args gathered by parseAtom and parseInnerExpressions

      argCount = arg.value.length

      for (const varName of arg.value) {
        if (varName.type===IOP1 && varName.value==='...') {

          // Spread operator (...x)

          instr.push(varName)
          argCount-- // Counts as 1 argument

        } else if (varName.type===IOP2 && varName.value==='=') {

          // Default Assignment

          instr.push(new Instruction(IEXPR, [varName, instr.pop(), instr.pop()].reverse()))
          argCount-=2 // Counts as 1 argument

        } else if (varName.type===IEXPR) {
          instr.push(varName)
        } else {
          instr.push(new Instruction(IVARNAME, varName.value))
        }
      }
    } else this.err(`Unknown function argrument type ${arg.type}:${arg.value}`)

    instr.push(new Instruction(IEXPR, funcInstr))
    instr.push(new Instruction(IFUNDEFANON, argCount))
    return true
  }


  parseAssignment(instr) {

    this.parseConditionalExpression(instr)
    if (this.parseAnonymousFunction(instr)) return

    while (this.accept(TOP, '=')) {

      this.parseAssignmentTarget(instr)

      const varValue = []
      this.parseAssignmentValue(varValue)
      instr.push(new Instruction(IEXPR, varValue))

      instr.push(binaryInstruction('='))
    }

    this.parseCompoundAssignment(instr)
  }

  parseAssignmentTarget(instr) {

    const varName = instr.pop()
    if (!varName) this.err('Expected variable for assignment but got '+varName)

    if (varName.type === IVAR) {

      instr.push(new Instruction(IVARNAME, varName.value))

    } else if (varName.type === IMEMBER) {

      // var.member - unshift, not push, for expected order

      const varWithMembers = [
        new Instruction(IMEMBER, varName.value)
      ]

      let prevInstr
      prevInstr = instr.pop()
      while (prevInstr && prevInstr.type === IMEMBER) {
        varWithMembers.unshift(new Instruction(IMEMBER, prevInstr.value))
        prevInstr = instr.pop()
      }

      if (prevInstr && prevInstr.type === IVAR) {
        varWithMembers.unshift(new Instruction(IVARNAME, prevInstr.value))
      } else if (prevInstr && prevInstr.type === IEXPR) {
        varWithMembers.unshift(new Instruction(prevInstr, prevInstr.value))
      } else {
        return this.err('Expected variable with members for assignment but got '+(!prevInstr ? 'undefined' : prevInstr.type))
      }

      instr.push(new Instruction(IVARNAME_MEMBER, varWithMembers))

    } else {
      // TODO: Destructuring
      return this.err('Expected variable for assignment but got '+varName.type+':'+varName.value)
    }
  }

  parseAssignmentValue(instr) {

    // Like parseExpression, but doesn't call parseAssignment again

    if (this.parseArray(instr)) return

    const isAfterObject = this.parseObject(instr)
    if (this.isEndOfExpression() || this.parseNextStatement(instr)) return

    // Include in current expression only what comes after an object
    // TODO: Clarify and generalize logic
    if (isAfterObject && (
      this.nextToken.type===TNAME || this.nextToken.type===TBRACKET
    )) return

    this.parseConditionalExpression(instr)
    this.parseAnonymousFunction(instr)
  }

  parseCompoundAssignment(instr) {

    if (!this.nextToken.value || !this.check(TOP,
      token => COMPOUND_ASSINGMENT_OPERATORS.indexOf(token.value as string)>=0
    )) return

    // Store token and advance
    const tokenValue = this.nextToken.value

    this.accept(TOP)

    // Extract target to use for value
    const targetInstr: Instructions = []
    this.parseCompoundAssignmentTarget(instr, targetInstr)

    // Parse original target
    instr.push(...targetInstr)
    this.parseAssignmentTarget(instr)

    let valueInstr

    if (tokenValue=='++' || tokenValue=='--') {
      valueInstr = new Instruction(INUMBER, 1)
    } else {
      const varValue = []
      this.parseAssignmentValue(varValue)
      valueInstr = new Instruction(IEXPR, varValue)
    }

    // x = x (op) (value)

    instr.push(new Instruction(IEXPR, [
      ...targetInstr,
      valueInstr,
      binaryInstruction(tokenValue[0])
    ]))

    instr.push(binaryInstruction('='))
  }

  parseCompoundAssignmentTarget(instr: Instructions, targetInstr: Instructions = []) {

    let varName = instr.pop()
    if (typeof varName==='undefined') return // Let parseAssignmentTarget handle error

    if (varName.type === IVAR) {
      targetInstr.push(varName)
      return
    }

    if (varName.type !== IMEMBER) {
      return this.err('Expected variable or member for compound assignment but got '+varName.type+':'+varName.value)
    }

    // var.member - unshift, not push, for expected order

    do {
      targetInstr.unshift(varName)
      varName = instr.pop()
    } while(typeof varName!=='undefined' && varName.type === IMEMBER)

    if (typeof varName==='undefined') {
      return this.err('Expected variable with members for compound assignment but got undefined')
    }

    if (varName.type === IVAR) {
      targetInstr.unshift(varName)
      return
    }

    this.err('Expected variable with members for compound assignment but got '+varName.type+':'+varName.value)
  }


  parseConditionalExpression(instr) {
    if (!this.parseIf(instr)) this.parseOr(instr)
    while (this.accept(TOP, '?')) {

      const trueBranch = []
      const falseBranch = []

      this.parseConditionalExpression(trueBranch)
      this.expect(TOP, ':')
      this.parseConditionalExpression(falseBranch)

      instr.push(new Instruction(IEXPR, trueBranch))
      instr.push(new Instruction(IEXPR, falseBranch))
      instr.push(ternaryInstruction('?'))
    }
  }

  parseIf(instr) {
    if (!this.accept(TOP, 'if')) return false
    do {

      this.parseOr(instr)

      // Optional
      this.accept(TOP, 'then')

      const trueBranch = []
      const falseBranch = []
      this.parseConditionalExpression(trueBranch)
      if (this.accept(TOP, 'else')) {
        this.parseConditionalExpression(falseBranch)
      }

      instr.push(new Instruction(IEXPR, trueBranch))
      instr.push(new Instruction(IEXPR, falseBranch))
      instr.push(ternaryInstruction('if'))
    } while (this.accept(TOP, 'if'))

    return true
  }

  parseOr(instr) {
    this.parseAnd(instr)
    while (this.accept(TOP, 'or') || this.accept(TOP, '||')) {
      const op = this.current
      const falseBranch = []
      this.parseAnd(falseBranch)
      instr.push(new Instruction(IEXPR, falseBranch))
      instr.push(binaryInstruction(op.value))
    }
  }

  parseAnd(instr) {
    this.parseComparison(instr)
    while (this.accept(TOP, 'and') || this.accept(TOP, '&&')) {
      const op = this.current
      const trueBranch = []
      this.parseComparison(trueBranch)
      instr.push(new Instruction(IEXPR, trueBranch))
      instr.push(binaryInstruction(op.value))
    }
  }

  parseComparison(instr) {
    this.parseAddSub(instr)
    while (this.accept(TOP, COMPARISON_OPERATORS)) {
      const op = this.current
      this.parseAddSub(instr)
      instr.push(binaryInstruction(op.value))
    }
  }

  parseAddSub(instr) {
    this.parseTerm(instr)
    while (this.accept(TOP, ADD_SUB_OPERATORS)) {
      const op = this.current
      this.parseTerm(instr)
      instr.push(binaryInstruction(op.value))
    }
  }

  parseTerm(instr) {
    // Return operator must be parsed early
    if (this.accept(TOP, 'return')) {
      this.parseExpression(instr)
      instr.push(unaryInstruction('return'))
      return
    }
    if (this.accept(TOP, 'not')) {
      this.parseExpression(instr)
      instr.push(unaryInstruction('not'))
      return
    }
    this.parseFactor(instr)
    while (this.accept(TOP, TERM_OPERATORS)) {
      const op = this.current
      this.parseFactor(instr)
      instr.push(binaryInstruction(op.value))
    }
  }

  acceptPrefixOperator() {
    return this.accept(TOP, (token) => token.value in this.tokens.unaryOps)
  }

  parseFactor(instr) {
    this.save()
    if (this.acceptPrefixOperator()) {

      if ((this.current.value !== '-' && this.current.value !== '+'
        && this.nextToken.type === TPAREN && this.nextToken.value === '(')) {
        this.restore()
        this.parseExponential(instr)
        return
      }

      const op = this.current
      this.parseFactor(instr)
      instr.push(unaryInstruction(op.value))
      return
    }
    this.parseExponential(instr)
  }

  parseExponential(instr) {
    this.parsePostfixExpression(instr)
    while (this.accept(TOP, '^')) {
      this.parseFactor(instr)
      instr.push(binaryInstruction('^'))
    }
  }

  parsePostfixExpression(instr) {
    this.parseFunctionCall(instr)
    while (this.accept(TOP, '!')) {
      instr.push(unaryInstruction('!'))
    }
  }

  parseFunctionCall(instr, withMember = false) {

    if (this.acceptPrefixOperator()) {
      const op = this.current
      this.parseAtom(instr)
      instr.push(unaryInstruction(op.value))
      return
    }

    if (!withMember) this.parseMember(instr)

    // If there's a white space before it, assume separate expression
    if (this.check(TPAREN, '(')) {
      this.tokens.save()
      this.tokens.pos -= 2 // It currently points to next token after (
      const isFunctionCall = !this.tokens.isWhitespace() && !this.tokens.isComment()
      this.tokens.restore()
      if (!isFunctionCall) return
    }

    while (this.accept(TPAREN, '(')) {

      if (this.accept(TPAREN, ')')) {
        instr.push(new Instruction(IFUNCALL, 0))
      } else {
        const argCount = this.parseArgumentList(instr)
        instr.push(new Instruction(IFUNCALL, argCount))
      }
    }

    this.parseFunctionApply(instr)
    this.parseMemberOfExpression(instr)
  }

  parseArgumentList(instr) {
    let argCount = 0
    if (!this.accept(TPAREN, ')') && this.hasNextToken()) {
      this.parseExpressions(instr)
      ++argCount
      while (this.accept(TCOMMA)) {
        this.parseExpressions(instr)
        ++argCount
      }
      this.expect(TPAREN, ')')
    }
    return argCount
  }


  parseMember(instr) {
    this.parseAtom(instr)
    this.parseMemberOfExpression(instr)
  }

  parseMemberOfExpression(instr) {
    this.parseFunctionApply(instr)
    while (this.accept(TOP, '.')) {
      if (this.accept(TNAME) || this.accept(TNUMBER) || this.accept(TSTRING)) {
        instr.push(new Instruction(IMEMBER, this.current.value))
      } else if (this.accept(TPAREN, '(')) {
        const exprInstr = []
        this.parseExpressions(exprInstr)
        this.expect(TPAREN, ')')
        instr.push(new Instruction(IMEMBER, new Instruction(IEXPR, exprInstr)))
      }
      this.parseFunctionCall(instr, true)
    }
  }

  parseWrappedExpression(instr) {
    if (!this.accept(TPAREN, '(')) return false
    if (!this.accept(TPAREN, ')') && this.hasNextToken()) {
      this.parseExpressions(instr)
      this.expect(TPAREN, ')')
    }
    return true
  }

  parseFunctionApply(instr) {
    while (this.accept(TOP, '->')) {
      this.save()

      const hasVar = this.accept(TNAME)
      const varName = this.current.value
      const isAnonFunc = this.check(TOP, '=>')

      if (hasVar && !isAnonFunc) {

        // -> x

        instr.push(new Instruction(IFUNAPPLY, varName))
        this.parseFunctionCall(instr, true)
        continue
      }

      const exprInstr: Instructions = []

      if (hasVar && isAnonFunc) {

        // -> x =>

        let argCount = 1
        const funcInstr = []

        this.expect(TOP, '=>')
        this.parseExpression(funcInstr)

        exprInstr.push(new Instruction(IVARNAME, varName))
        exprInstr.push(new Instruction(IEXPR, funcInstr))
        exprInstr.push(new Instruction(IFUNDEFANON, argCount))

      } else {

        // -> (..)

        this.restore()

        this.parseWrappedExpression(exprInstr)
        if (this.check(TOP, '=>')) {
          this.parseAnonymousFunction(exprInstr)
        }
      }

      instr.push(new Instruction(IFUNAPPLY, new Instruction(IEXPR, exprInstr)))
      this.parseFunctionCall(instr, true)
    }
  }
}
