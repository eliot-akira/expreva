const { eva } = require('./common')

test('arithmetic', it => {
  const is = eva(it)

  is('1 + 1', 2)
  is('1 + 2 * 3', 7)
  is('(1 + 2) * 3', 9)
  is('10 / 2', 5)
})
