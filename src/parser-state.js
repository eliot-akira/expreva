import {
  TOP,
  TNUMBER,
  TSTRING,
  TPAREN,
  TBRACKET,
  TCOMMA,
  TNAME,
  TSEMICOLON,
  TEOF
} from './token'
import {
  Instruction,
  INUMBER,
  IVAR,
  IVARNAME,
  IFUNDEF,
  IFUNDEFANON,
  IFUNCALL,
  IFUNAPPLY,
  IEXPR,
  IMEMBER,
  IARRAY,
  IOBJECT,
  IENDSTATEMENT,
  ternaryInstruction,
  binaryInstruction,
  unaryInstruction
} from './instruction'
import { contains } from './utils'

const COMPARISON_OPERATORS = ['==', '!=', '<', '<=', '>=', '>', 'in']
const ADD_SUB_OPERATORS = ['+', '-']
const TERM_OPERATORS = ['*', '/', '%']

export class ParserState {

  constructor(parser, tokenStream, options = {}) {
    this.parser = parser
    this.tokens = tokenStream
    this.current = null
    this.nextToken = null
    this.next()
    this.savedCurrent = null
    this.savedNextToken = null
    this.err = function (...args) {
      throw new Error(args[0])
    }
  }

  // Start here
  parse(instr) {
    this.parseExpressions(instr)
  }

  next() {
    this.current = this.nextToken
    return (this.nextToken = this.tokens.next())
  }

  tokenMatches(token, value) {
    if (typeof value === 'undefined') {
      return true
    } else if (Array.isArray(value)) {
      return contains(value, token.value)
    } else if (typeof value === 'function') {
      return value(token)
    } else {
      return token.value === value
    }
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

  check(type, value) {
    return this.nextToken.type === type && this.tokenMatches(this.nextToken, value)
  }

  hasNextToken() {
    return this.nextToken && this.nextToken.type !== TEOF
  }

  accept(type, value) {
    if (this.check(type, value)) {
      this.next()
      return true
    }
    return false
  }

  acceptPrefixOperator() {
    return this.accept(TOP, (token) => token.value in this.tokens.unaryOps)
  }

  expect(type, value) {

    if (this.accept(type, value)) return true

    const coords = this.tokens.getCoordinates()
    return this.err(
      `Parse error on line ${coords.line}, column ${coords.column}: Expected ${
        type + (value ? ` "${value}"` : '')
      } but got ${
        (this.nextToken && (this.nextToken.type + (
          this.nextToken.value ? ` "${this.nextToken.value}"` : ''))) || 'undefined'
      }`)
  }

  isEndOfExpression() {
    return !this.hasNextToken()
      || this.nextToken.type===TSEMICOLON
      || (this.nextToken.type === TPAREN && this.nextToken.value === ')')
      || (this.nextToken.type === TBRACKET &&
        (this.nextToken.value === '}' || this.nextToken.value === ']')
      )
      || (this.nextToken.type === TOP && this.nextToken.value === '->')
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
      //this.err('Unexpected ' + this.nextToken)
      return
    }
  }


  parseExpressions(instr) {
    this.parseExpression(instr)
    this.parseNextStatement(instr)

    // const exprInstr = []
    // this.parseExpression(exprInstr)
    // if (!this.parseNextStatement(instr, exprInstr)) {
    //   instr.push(...exprInstr)
    // }
  }

  parseExpression(instr) {
    // This starts the chain of parse steps
    this.parseArray(instr)
  }

  parseNextStatement(instr, exprInstr = []) {
    if (!this.accept(TSEMICOLON)) return false
    if (!this.isEndOfExpression()) {
      exprInstr.push(new Instruction(IENDSTATEMENT))
      this.parseExpressions(exprInstr)
    }
    instr.push(...exprInstr)
    //if (exprInstr[0]) instr.push(new Instruction(IEXPR, exprInstr))
    return true
  }

  parseInnerExpressions(instr) {

    if (!this.accept(TPAREN, '(')) return false

    this.parseExpressions(instr)

    if (this.accept(TPAREN, ')')) return true

    // Possible argument list for an anomymous function

    const expr = instr.pop()
    const exprInstr = [expr]

    this.expect(TCOMMA)

    do {
      this.parseExpressions(exprInstr)
    } while (this.hasNextToken() && this.accept(TCOMMA))

    this.expect(TPAREN, ')')

    instr.push(new Instruction(IEXPR, exprInstr))

    this.parseAnonymousFunction(instr)

    return true
  }


  parseArray(instr) {

    if (!this.accept(TBRACKET, '[')) {
      this.parseObject(instr)
      if (!this.isEndOfExpression() && !this.parseNextStatement(instr)) {
        this.parseVariableAssignment(instr)
      }
      return
    }

    let argCount = 0

    if (!this.accept(TBRACKET, ']') && this.hasNextToken()) {

      this.parseArrayItem(instr)
      argCount++

      while (this.accept(TCOMMA)) {
        this.parseArrayItem(instr)
        argCount++
      }

      this.expect(TBRACKET, ']')
    }

    instr.push(new Instruction(IARRAY, argCount))

    if (this.accept(TOP, '+')) {
      this.parseExpression(instr)
      instr.push(binaryInstruction('+'))
      return
    }

    this.parseMemberOfExpression(instr)
  }

  parseArrayItem(instr) {
    if (!this.parseSpreadOperator(instr)) {
      this.parseExpressions(instr)
    }
  }

  parseSpreadOperator(instr) {
    if (!this.accept(TOP, '...')) return false

    // TODO: Spread operator

    // Variable or expression

    return true
  }

  parseObject(instr) {

    if (!this.accept(TBRACKET, '{')) return

    let keyValuePairCount = 0

    if (!this.accept(TBRACKET, '}') && this.hasNextToken()) {

      const pairs = []
      do {
        const pair = []
        if (this.parseKeyValuePair(pair)) {
          keyValuePairCount++
          pairs.push(pair)
        }
      } while (this.accept(TCOMMA))

      // Expected order to key/value pairs
      pairs.reverse().forEach(function(pair) {
        instr.push(...pair)
      })

      this.expect(TBRACKET, '}')
    }

    instr.push(new Instruction(IOBJECT, keyValuePairCount))

    if (this.accept(TOP, '+')) {
      this.parseObject(instr)
      instr.push(binaryInstruction('+'))
      return
    }

    this.parseMemberOfExpression(instr)
  }

  parseKeyValuePair(instr) {

    if (this.parseSpreadOperator(instr)) return true

    // Key

    if (this.accept(TNAME) || this.accept(TNUMBER) || this.accept(TSTRING)) {
      instr.push(new Instruction(INUMBER, this.current.value))
    } else if (this.accept(TPAREN, '(')) {

      // Expression as key

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

    // { variable }
    const key = instr.pop()
    instr.push(key, key)
    return true
  }


  parseAnonymousFunction(instr) {

    if (!this.accept(TOP, '=>')) return false

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
      // Args gathered by parseAtom
      argCount = arg.value.length
      for (const varName of arg.value) {
        instr.push(new Instruction(IVARNAME, varName.value))
      }
    }

    instr.push(new Instruction(IEXPR, funcInstr))
    instr.push(new Instruction(IFUNDEFANON, argCount))
    return true
  }

  parseVariableAssignment(instr) {

    this.parseConditionalExpression(instr)
    if (this.parseAnonymousFunction(instr)) return

    while (this.accept(TOP, '=')) {
      const varName = instr.pop()
      const varValue = []

      if (varName.type !== IVAR && varName.type !== IMEMBER) {
        return this.err('Expected variable for assignment but got '+varName.type)
      }

      this.parseExpression(varValue)

      instr.push(new Instruction(IVARNAME, varName.value))
      instr.push(new Instruction(IEXPR, varValue))
      instr.push(binaryInstruction('='))
    }
  }

  parseConditionalExpression(instr) {

    this.parseOr(instr)
    this.parseIf(instr)

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
    while (this.accept(TOP, 'if')) {
      this.parseOr(instr)
      this.expect(TOP, 'then')

      const trueBranch = []
      const falseBranch = []
      this.parseConditionalExpression(trueBranch)
      if (this.accept(TOP, 'else')) {
        this.parseConditionalExpression(falseBranch)
      }

      instr.push(new Instruction(IEXPR, trueBranch))
      instr.push(new Instruction(IEXPR, falseBranch))
      instr.push(ternaryInstruction('if'))
    }
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
    this.parseFactor(instr)
    while (this.accept(TOP, TERM_OPERATORS)) {
      const op = this.current
      this.parseFactor(instr)
      instr.push(binaryInstruction(op.value))
    }
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
    if (this.accept(TOP, 'return')) {
      instr.push(unaryInstruction('return'))
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

    while (this.accept(TPAREN, '(')) {
      if (this.accept(TPAREN, ')')) {
        instr.push(new Instruction(IFUNCALL, 0))
      } else {
        const argCount = this.parseArgumentList(instr)
        instr.push(new Instruction(IFUNCALL, argCount))
      }
    }

    this.parseFunctionApply(instr)
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
      } else {
        let argCount
        const exprInstr = []

        if (hasVar && isAnonFunc) {
          // -> x =>
          argCount = 1
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
      }
      // -> x()
      this.parseFunctionCall(instr, true)
    }
  }

}
