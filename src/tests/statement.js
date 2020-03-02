const { eva } = require('./common')

test('statement', it => {
  const is = eva(it)

  is('1;2;3', 3)
  is('(1;2;3)', 3)

  is('[ (1 ; 2) ]', [2])

  // is('[ (1 ; 2), 3 ]', [2, 3])
  is('{ a: (1 ; 2) }', { a: 2 })
  // is('{ a: (1 ; 2), b: 3 }', { a: 2, b: 3 })
  is('{ a: (f = x => x * x; f(3)) }', { a: 9 })

})

// test('return', it => {
//   const is = eva(it)

//   is(`x = 1
// return 2==2
// x = 3`
//   , true)
// })
