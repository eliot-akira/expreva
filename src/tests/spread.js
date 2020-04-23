const { eva } = require('./common')

test('spread', it => {
  const is = eva(it)

  // Array
  is(`[ 0, ...[ 1, 2, 3 ], 4 ]`, [0, 1, 2, 3, 4])
  is(`a = { b: [1, 2, 3] } [ 0, ...a.b->push(4), 5 ]`, [0, 1, 2, 3, 4, 5])

  // Object
  is(`{ a: 1, ...{ b: 2, c: 3 }, d: 4 }`, { a: 1, b: 2, c: 3, d: 4 })
  is(`a = { b: 2 } { a: 1, ...a->set('c', 3), d: 4 }`, { a: 1, b: 2, c: 3, d: 4 })

  // Function arguments
  is(`f = (x, ...y) => y f(1, 2, 3, 4)`, [2, 3, 4])

  is(`f = (x, ...y) => [x, ...y] f(1, 2, 3, 4)`, [1, 2, 3, 4])
  is(`f = (x, ...y) => x + y->reduce((total, value) => total += value, 0) f(1, 2, 3, 4)`, 10)
})
