const { eva } = require('./common')

test('object', it => {
  const is = eva(it)

  is(`{ a: 1, b: 2, c: 3 }`, { a: 1, b: 2, c: 3 })
  is('[ {}, 1 ]', [ {}, 1 ])
  is('{ a: 1 + 2 }', { a: 3 })

  // Single key/value
  is(`key = 'value'; { key }`, { key: 'value' })

  // Dynamic key with single variable (x)
  is(`
f = x => {
  x: 'literal key',
  (x): (x==3 ? 'is 3' : 'is not 3'),
  another: 'value'
}
f(3)
`, {
    x: 'literal key',
    3: 'is 3',
    another: 'value'
  })

})
