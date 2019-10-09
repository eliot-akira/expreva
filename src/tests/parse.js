const { parse, evaluate } = require('./common')

test('parse', it => {

  let result = parse('1')

  it('parses', result)
  it('returns instructions', result.instructions)
  it('result can be evaluated', result.evaluate()===1)
  it('instructions can be evaluated', evaluate(result.instructions)===1)
})

test('parse invalid', it => {
  it(')', it.throws(() => parse(')')))
  it('}', it.throws(() => parse('}')))
  it(']', it.throws(() => parse(']')))
  it('.', it.throws(() => parse('.')))

  //it('x->', it.throws(() => parse('x->')))
})
