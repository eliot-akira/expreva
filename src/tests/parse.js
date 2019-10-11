const { parse, evaluate } = require('./common')

test('parse', it => {

  let result = parse('1')

  it('parses', result)
  it('returns instructions', result.instructions)
  it('result can be evaluated', result.evaluate()===1)
  it('instructions can be evaluated', evaluate(result.instructions)===1)
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