const { parse, evaluate, Instruction } = require('./common')

test('parse', it => {

  let instructions = parse('1')

  it('parses', instructions)
  it('returns instructions', it.is(instructions, [new Instruction('INUMBER', 1)]))
  it('instructions are evaluated', it.is(evaluate(instructions), 1))
})

test('parse invalid', it => {
  const invalidExpressions = [
    '(',
    ')',
    '{',
    '}',
    '[',
    ']',
    '.',
    ',',
    '->',
    '?',
    ':'
  ]

  for (const expr of invalidExpressions) {
    it(expr, it.throws(() => parse(expr)))
  }
})

test('parse valid', it => {
  const validExpressions = [
    '()',
    '{}',
    '[]',
    'a={} a.b',
    '[1,2]',
    '1->()',
    'true?1:0',
    '{a:1}'
  ]

  for (const expr of validExpressions) {
    it(expr, !it.throws(() => parse(expr)))
  }
})