const { parse, evaluate } = require('./common')

test('expreva', it => {
  it('has method evaluate', evaluate)
  it('has method parse', parse)
})

test('parse', it => {

  let result = parse('1')

  it('parses', result)
  it('returns instructions', result.instructions)
  it('result can be evaluated', result.evaluate()===1)
  it('instructions can be evaluated', evaluate(result.instructions)===1)
})


test('arithmetic', it => {

  it('1 + 1', evaluate('1 + 1')===2)
  it('1 + 2 * 3', evaluate('1 + 2 * 3')===7)
  it('(1 + 2) * 3', evaluate('(1 + 2) * 3')===9)
  it('10 / 2', evaluate('10 / 2')===5)
})

test('comparison', it => {

  it('1 + 1 == 2', evaluate('1 + 1 == 2')===true)
  it('1 + 1 != 2', evaluate('1 + 1 != 2')===false)
  it('3 * 3 > 3 + 3', evaluate('3 * 3 > 3 + 3')===true)
  it('1 + 1 < 2', evaluate('1 + 1 < 2')===false)
  it('2 * 2 >= 2 + 2', evaluate('2 * 2 >= 2 + 2')===true)
  it('3 + 3 <= 2 + 3', evaluate('3 + 3 <= 2 + 3')===false)
  it('2 == 2 && 3 == 3', evaluate('2 == 2 && 3 == 3')===true)
  it('2 != 2 || 3 == 3', evaluate('2 != 2 || 3 == 3')===true)
})

test('operator: conditional', it => {

  it('true ? 1 : 0', evaluate('true ? 1 : 0')===1)
  it('false ? 1 : 0', evaluate('false ? 1 : 0')===0)
  it('false ? 1 : true ? 0 : 2', evaluate('false ? 1 : true ? 0 : 2')===0)
  it('false ? 1 : false ? 0 : 2', evaluate('false ? 1 : false ? 0 : 2')===2)
  it('x = 0; true ? (x = 1) : (x = 2); x', evaluate('x = 0; true ? (x = 1) : (x = 2); x')===1)
})

test('if', it => {

  let code

  code = `if true then 'YES' else 'NO'`
  it(code, evaluate(code)==='YES')
  code = `if false then 'YES' else 'NO'`
  it(code, evaluate(code)==='NO')
  code = `if true and true then 'YES' else 'NO'`
  it(code, evaluate(code)==='YES')
  code = `if true and false then 'YES' else 'NO'`
  it(code, evaluate(code)==='NO')
  code = `if false and true then 'YES' else 'NO'`
  it(code, evaluate(code)==='NO')

  code = `if 3->(x=>x*x)==9 then 'YES' else 'NO'`
  it(code, evaluate(code)==='YES')
  code = `if 3->(x=>x*x)==10 then 'YES' else 'NO'`
  it(code, evaluate(code)==='NO')
  code = `if 3->(x=>x*x)==9 then if true then 'YES' else 'NO'`
  it(code, evaluate(code)==='YES')
  code = `if 3->(x=>x*x)==9 then if false then 'YES' else 'NO'`
  it(code, evaluate(code)==='NO')

  // TODO: Not should get following expression
  code = `if not 1 > 2 then true else false`
  it(code, evaluate(code)===true)
})


test('list', it => {

  it('[ 1, 2, 3 ]', it.is(evaluate('[ 1, 2, 3 ]'), [ 1, 2, 3 ]))

  it(`[ { x: 'y' } ]`, it.is(evaluate(`[ { x: 'y' } ]`), [ { x: 'y' } ]))
  it(`[ 'a', 'b', { x: 'y' }, 'd' ]`, it.is(evaluate(`[ 'a', 'b', { x: 'y' }, 'd' ]`), [ 'a', 'b', { x: 'y' }, 'd' ]))

  let code = `[ true, 2 * 3 + 1, f = x => x * x, f(12), [ 'apples', 'oranges' ] ]`
  let result = evaluate(code)
  let f = result[2]

  it(`[ true, 2 * 3 + 1, f = x => x * x, f(12), [ 'apples', 'oranges' ] ]`,
    it.is(result, [ true, 7, f, 144, [ 'apples', 'oranges' ] ])
  )

})

test('object', it => {

  let code
  code = `{ a: 1, b: 2, c: 3 }`
  it(code, it.is(evaluate(code), { a: 1, b: 2, c: 3 }))

  code = `key = 'value'; { key }`
  it(code, it.is(evaluate(code), { key: 'value' }))

})

test('function', it => {

  let f = evaluate('x => x * x')

  it('create function: x => x * x', f instanceof Function)
  it('function runs correctly: x => x * x', f(3)===9)

  let code
  code = '(x => x * x)(3)'
  it(code, evaluate(code)===9)

  code = '((x, y) => x * y)(3, 4)'
  it(code, evaluate(code)===12)

  code = '(x => y => z => x * y * z)(3)(4)(5)'
  it(code, evaluate(code)===60)

  code = 'percent = x => x / 100; percent(2)'
  it(code, evaluate(code)===2/100)
})


test('member', it => {
  it('[ 1, 2, 3 ].0', it.is(evaluate('[ 1, 2, 3 ].0'), 1))
  it(`[ [ 1, 2, 3 ], [ 'a', 'b', 'c' ] ].1.2`, it.is(evaluate(`[ [ 1, 2, 3 ], [ 'a', 'b', 'c' ] ].1.2`), 'c'))
})

test('assignment', it => {

  let code

  code = `a = {}
a.b = 'hi'
a
`

  it(code, it.is(evaluate(code), { b: 'hi' }))
  code = `a=[1]
b=[2]
b`
  it(code, it.is(evaluate(code), [2]))
})

test('assignment: member', it => {

  let code

  code = `a = {}; a.b = {}; a.b.c = 1; a`
  it(code, it.is(evaluate(code), { b: { c: 1 } }))
  code = `a = {}; a.b = {}; a.b.c = 1`
  it(code, it.is(evaluate(code), 1))

  code = `a = [1, []]; a.1.0 = 2; a`
  it(code, it.is(evaluate(code), [ 1, [ 2 ] ]))
  code = `a = [1, []]; a.1.0 = 2`
  it(code, it.is(evaluate(code), 2))
})


test('apply', it => {

  it('[ 1, 2, 3 ]->map(x => x * x)', it.is(evaluate('[ 1, 2, 3 ]->map(x => x * x)'), [ 1, 4, 9 ]))

  let code = `{ a:1, b:2, c:3 }->map((key,value) => key+'='+value)->join(' ')`
  it(code, evaluate(code)==='a=1 b=2 c=3')
})


test('apply to anonymous function', it => {

  it('3->x => x * x', evaluate('3->x => x * x')===9)
  it('3->(x => x * x)', evaluate('3->(x => x * x)')===9)
  it('3->(x => x) * 3', evaluate('3->(x => x) * 3')===9)
  it('3->(x => x)->(x => x)', evaluate('3->(x => x)->(x => x)')===3)
  it('3->(x => x)->(x => x * x)', evaluate('3->(x => x)->(x => x * x)')===9)
  it('3->(x => x * x)->(x => x * x)', it.is(evaluate('3->(x => x * x)->(x => x * x)'), 81))
  //it('3->x => x * x -> x => x * x', it.is(evaluate('3->x => x * x->x => x * x)'), 81))

})


test('statement', it => {
  it('1 ; 2 ; 3', it.is(evaluate('1 ; 2 ; 3'), 3))
  it('[ 1 ; 2 ] == [ 2 ]', it.is(evaluate('[ 1 ; 2 ]'), [2]))
  it('[ 1 ; 2, 3 ] == [ 2, 3 ] ', it.is(evaluate('[ 1 ; 2, 3 ]'), [2, 3]))
  it('{ a: 1 ; 2 }', it.is(evaluate('{ a: 1 ; 2 }'), { a: 2 }))
  it('{ a: 1 ; 2, b: 3 }', it.is(evaluate('{ a: 1 ; 2, b: 3 }'), { a: 2, b: 3 }))
  it('{ a: (f = x => x * x; f(3)) }', it.is(evaluate('{ a: (f = x => x * x; f(3)) }'), { a: 9 }))
})


test('return', it => {

  let code = `x = 1
return 2==2
x = 3`
  it(code, it.is(evaluate(code), true))
})