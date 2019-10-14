const { eva } = require('./common')

test('apply', it => {
  const is = eva(it)

  is('[ 1, 2, 3 ]->map(x => x * x)', [ 1, 4, 9 ])
  is(`{ a:1, b:2, c:3 }->map((key,value) => key+'='+value)->join(' ')`, 'a=1 b=2 c=3')
})


test('apply to anonymous function', it => {
  const is = eva(it)

  is('3->x => x * x', 9)
  is('3->(x => x * x)', 9)
  is('3->(x => x) * 3', 9)
  is('3->(x => x)->(x => x)', 3)
  is('3->(x => x)->(x => x * x)', 9)
  is('3->(x => x * x)->(x => x * x)', 81)
})
