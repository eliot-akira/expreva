const { eva } = require('./common')

test('nil', it => {
  const is = eva(it)

  is('a = []; a.0 == nil', true)
  is('a = [ 1 ]; a.0 != nil', true)
  is('a = {}; a.b == nil', true)
  is('a = { b: \'c\' }; a.b != nil', true)
})
