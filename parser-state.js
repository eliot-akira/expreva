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
  IANONFUNDEF,
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
import { func } from 'prop-types'

const COMPARISON_OPERATORS = ['==', '!=', '<', '<=', '>=', '>', 'in']
const ADD_SUB_OPERATORS = ['+', '-', '||']
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
  isEndOfExpression() {
    return !this.hasNextToken() || (this.nextToken.type === TPAREN && this.nextToken.value === ')')
      || this.nextToken.type === TBRACKET && this.nextToken.value === '}'
      || this.nextToken.type===TSEMICOLON
  }
  accept(type, value) {
    if (this.check(type, value)) {
      this.next()
      return true
    }
    return false
  }
  expect(type, value) {
    if (!this.accept(type, value)) {
      const coords = this.tokens.getCoordinates()
      return this.err('Parse error [' + coords.line + ':' + coords.column + ']: Expected '
        + (type + ' ' + value)
        + ' but got ' + (this.nextToken && (this.nextToken.type + ' ' + this.nextToken.value)) || 'undefined')
    }
  }
  parseAtom(instr) {
    if (this.accept(TNAME)) {
      instr.push(new Instruction(IVAR, this.current.value))
    } else if (this.accept(TNUMBER)) {
      instr.push(new Instruction(INUMBER, this.current.value))
    } else if (this.accept(TSTRING)) {
      instr.push(new Instruction(INUMBER, this.current.value))
    } else if (this.accept(TPAREN, '(')) {

      this.parseExpression(instr)

      if (this.accept(TPAREN, ')')) return

      // Argument list for an anomymous function
      const expr = instr.pop()
      const exprInstr = [expr]

      this.expect(TCOMMA)

      do {

        this.parseExpression(exprInstr)

      } while (this.hasNextToken() && this.accept(TCOMMA))

      this.expect(TPAREN, ')')

      instr.push(new Instruction(IEXPR, exprInstr))

      this.parseAnonymousFunction(instr)

    } else if (this.accept(TEOF)) {
      return
    } else {
      return this.err('Unexpected ' + this.nextToken)
    }
  }
  parseExpression(instr) {

    const exprInstr = []
    if (this.parseUntilEndStatement(instr, exprInstr)) return
    this.parseArrayExpression(exprInstr)
    if (this.parseUntilEndStatement(instr, exprInstr)) return
    this.pushExpression(instr, exprInstr)
    this.parseMemberOfExpression(instr)
    this.parseUntilEndStatement(instr, exprInstr)
  }
  pushExpression(instr, exprInstr) {
    for (let i = 0, len = exprInstr.length; i < len; i++) {
      instr.push(exprInstr[i])
    }
  }
  parseUntilEndStatement(instr, exprInstr = []) {

    if (!this.accept(TSEMICOLON)) return false
    if (!this.isEndOfExpression()) {
      exprInstr.push(new Instruction(IENDSTATEMENT))
      this.parseExpression(exprInstr)
    }
    if (exprInstr[0]) instr.push(new Instruction(IEXPR, exprInstr))
    return true
  }

  parseArrayExpression(instr) {
    if (!this.accept(TBRACKET, '[')) {
      this.parseObjectExpression(instr)
      if (!this.isEndOfExpression() && !this.parseUntilEndStatement(instr)) {
        this.parseVariableAssignmentExpression(instr)
      }
      return
    }
    let argCount = 0
    if (!this.accept(TBRACKET, ']') && this.hasNextToken()) {
      this.parseExpression(instr)
      ++argCount
      while (this.accept(TCOMMA)) {
        this.parseExpression(instr)
        ++argCount
      }

      this.expect(TBRACKET, ']')
    }
    instr.push(new Instruction(IARRAY, argCount))
    if (this.accept(TOP, '+')) {
      this.parseArrayExpression(instr)
      instr.push(binaryInstruction('+'))
    } else {
      this.parseMemberOfExpression(instr)
    }
  }
  parseObjectExpression(instr) {
    if (!this.accept(TBRACKET, '{')) {
      return
    }
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
      this.parseObjectExpression(instr)
      instr.push(binaryInstruction('+'))
    } else {
      this.parseMemberOfExpression(instr)
    }
  }
  parseKeyValuePair(instr) {
    // Key
    if (this.accept(TNAME) || this.accept(TNUMBER) || this.accept(TSTRING)) {
      instr.push(new Instruction(INUMBER, this.current.value))
    } else if (this.accept(TPAREN, '(')) {
      const exprInstr = []
      this.parseExpression(exprInstr)
      this.expect(TPAREN, ')')
      instr.push(new Instruction(IEXPR, exprInstr))
    } else {
      return false
    }
    this.expect(TOP, ':')
    // Value
    this.parseExpression(instr)
    return true
  }

  parseAnonymousFunction(instr) {

    if (!this.accept(TOP, '=>')) return false

    const funcInstr = []
    this.parseArrayExpression(funcInstr)

    // Backtrack to get function arguments
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
    instr.push(new Instruction(IANONFUNDEF, argCount))
    return true
  }

  parseVariableAssignmentExpression(instr) {

    this.parseConditionalExpression(instr)
    if (this.parseAnonymousFunction(instr)) return

    while (this.accept(TOP, '=')) {
      const varName = instr.pop()
      const varValue = []
      // Define function
      if (varName.type === IFUNCALL) {
        // Backtrack to function name and arguments and transform IVAR to IVARNAME
        const instrLast = instr.length - 1
        for (let i = 0, len = varName.value + 1; i < len; i++) {
          const index = instrLast - i
          if (instr[index].type === IVAR) {
            instr[index] = new Instruction(IVARNAME, instr[index].value)
          }
        }
        this.parseArrayExpression(varValue) // parseVariableAssignmentExpression
        instr.push(new Instruction(IEXPR, varValue))
        instr.push(new Instruction(IFUNDEF, varName.value))
        continue
      }
      if (varName.type !== IVAR && varName.type !== IMEMBER) {
        return this.err('Expected variable for assignment but got '+varName.type)
      }
      this.parseArrayExpression(varValue) // parseVariableAssignmentExpression
      instr.push(new Instruction(IVARNAME, varName.value))
      instr.push(new Instruction(IEXPR, varValue))
      instr.push(binaryInstruction('='))
    }
  }
  parseConditionalExpression(instr) {
    this.parseOrExpression(instr)
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
  parseOrExpression(instr) {
    this.parseAndExpression(instr)
    while (this.accept(TOP, 'or')) {
      const falseBranch = []
      this.parseAndExpression(falseBranch)
      instr.push(new Instruction(IEXPR, falseBranch))
      instr.push(binaryInstruction('or'))
    }
  }
  parseAndExpression(instr) {
    this.parseComparison(instr)
    while (this.accept(TOP, 'and')) {
      const trueBranch = []
      this.parseComparison(trueBranch)
      instr.push(new Instruction(IEXPR, trueBranch))
      instr.push(binaryInstruction('and'))
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
    const unaryOps = this.tokens.unaryOps
    function isPrefixOperator(token) {
      return token.value in unaryOps
    }
    this.save()
    if (this.accept(TOP, isPrefixOperator)) {
      if ((this.current.value !== '-' && this.current.value !== '+'
        && this.nextToken.type === TPAREN && this.nextToken.value === '(')) {
        this.restore()
        this.parseExponential(instr)
      } else {
        const op = this.current
        this.parseFactor(instr)
        instr.push(unaryInstruction(op.value))
      }
    } else {
      this.parseExponential(instr)
    }
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
  parseFunctionCall(instr, withMember) {
    const unaryOps = this.tokens.unaryOps
    function isPrefixOperator(token) {
      return token.value in unaryOps
    }
    if (this.accept(TOP, isPrefixOperator)) {
      const op = this.current
      this.parseAtom(instr)
      instr.push(unaryInstruction(op.value))
    } else {
      if (!withMember) this.parseMemberExpression(instr)
      while (this.accept(TPAREN, '(')) {
        if (this.accept(TPAREN, ')')) {
          instr.push(new Instruction(IFUNCALL, 0))
        } else {
          const argCount = this.parseArgumentList(instr)
          instr.push(new Instruction(IFUNCALL, argCount))
        }
      }
    }
  }
  parseArgumentList(instr) {
    let argCount = 0
    if (!this.accept(TPAREN, ')') && this.hasNextToken()) {
      this.parseExpression(instr)
      ++argCount
      while (this.accept(TCOMMA)) {
        this.parseExpression(instr)
        ++argCount
      }
      this.expect(TPAREN, ')')
    }
    return argCount
  }
  parseMemberExpression(instr) {
    this.parseAtom(instr)
    this.parseMemberOfExpression(instr)
  }
  parseMemberOfExpression(instr) {
    this.parseFunctionApplyExpression(instr)
    while (this.accept(TOP, '.')) {
      if (this.accept(TNAME) || this.accept(TNUMBER) || this.accept(TSTRING)) {
        instr.push(new Instruction(IMEMBER, this.current.value))
      } else if (this.accept(TPAREN, '(')) {
        const exprInstr = []
        this.parseExpression(exprInstr)
        this.expect(TPAREN, ')')
        instr.push(new Instruction(IMEMBER, new Instruction(IEXPR, exprInstr)))
      }
      this.parseFunctionCall(instr, true)
    }
  }

  parseFunctionApplyExpression(instr) {
    while (this.accept(TOP, '->')) {

      this.save()

      if (this.accept(TNAME) && !this.check(TOP, '=>')) {

        instr.push(new Instruction(IFUNAPPLY, this.current.value))

      } else {

        this.restore()

        const exprInstr = []
        this.parseExpression(exprInstr)
        instr.push(new Instruction(IFUNAPPLY, new Instruction(IEXPR, exprInstr)))
      }

      this.parseFunctionCall(instr, true)
    }
  }
}
