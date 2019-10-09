const { eva } = require('./common')

test('conditional operators', it => {
  const is = eva(it)

  is('true ? 1 : 0', 1)
  is('false ? 1 : 0', 0)
  is('false ? 1 : true ? 0 : 2', 0)
  it('false ? 1 : false ? 0 : 2', 2)
  is('x = 0; true ? (x = 1) : (x = 2); x', 1)
})


test('if', it => {
  const is = eva(it)

  is(`if true then 'YES' else 'NO'`, 'YES')
  is(`if false then 'YES' else 'NO'`, 'NO')
  is(`if true and true then 'YES' else 'NO'`, 'YES')
  is(`if true and false then 'YES' else 'NO'`, 'NO')
  is(`if false and true then 'YES' else 'NO'`, 'NO')

  is(`if 3->(x=>x*x)==9 then 'YES' else 'NO'`, 'YES')
  is(`if 3->(x=>x*x)==10 then 'YES' else 'NO'`, 'NO')
  is(`if 3->(x=>x*x)==9 then if true then 'YES' else 'NO'`, 'YES')
  is(`if 3->(x=>x*x)==9 then if false then 'YES' else 'NO'`, 'NO')

  // TODO: Not should get following expression
  is(`if not 1 > 2 then true else false`, true)
})
