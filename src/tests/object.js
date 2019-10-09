const { eva } = require('./common')

test('object', it => {
  const is = eva(it)

  is(`{ a: 1, b: 2, c: 3 }`, { a: 1, b: 2, c: 3 })
  is(`key = 'value'; { key }`, { key: 'value' })
})
