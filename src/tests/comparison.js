const { eva } = require('./common')

test('comparison', it => {
  const is = eva(it)

  is('1 + 1 == 2', true)
  is('1 + 1 != 2', false)
  is('3 * 3 > 3 + 3', true)
  is('1 + 1 < 2', false)
  is('2 * 2 >= 2 + 2', true)
  is('3 + 3 <= 2 + 3', false)
  is('2 == 2 && 3 == 3', true)
  is('2 != 2 || 3 == 3', true)
})
