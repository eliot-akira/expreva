const { eva, evaluate } = require('./common')

test('function', it => {
  const is = eva(it)

  let f = evaluate('x => x * x')

  it('create function: x => x * x', f instanceof Function)
  it('function runs correctly: x => x * x', f(3)===9)

  is('(x => x * x)(3)', 9)
  is('((x, y) => x * y)(3, 4)', 12)
  is('(x => y => x * y)(3)(4)', 12)
  is('(x => y => z => x * y * z)(3)(4)(5)', 60)
  is('percent = x => x / 100; percent(2)', 2/100)

  is('f = (x, y) => x ; f(true, () => 1)', true)

})

// test('function default arguments', it => {
//   const is = eva(it)
//   is('f = (x = 1, y = 2) => x + y f()', 3)
//   is('f = (x = 1, y = 2) => x + y f(3)', 5)
//   is('f = (x = 1, y = 2) => x + y f(3, 4)', 7)
// })
