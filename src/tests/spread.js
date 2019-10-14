const { eva } = require('./common')

test('spread', it => {
  const is = eva(it)

  is(`a = { b: [1, 2, 3] } [ 0, ...a.b->push(4), 5 ]`, [0, 1, 2, 3, 4, 5])
  is(`a = { b: 2 } { a: 1, ...a->set('c', 3), d: 4 }`, { a: 1, b: 2, c: 3, d: 4 })
})
