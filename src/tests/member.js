const { eva } = require('./common')

test('member', it => {
  const is = eva(it)
  is('[ 1, 2, 3 ].0', 1)
  is(`[ [ 1, 2, 3 ], [ 'a', 'b', 'c' ] ].1.2`, 'c')
})

test('member assignment', it => {
  const is = eva(it)

  is(`a = {}; a.b = {}; a.b.c = 1; a`, { b: { c: 1 } })
  is(`a = {}; a.b = {}; a.b.c = 1`, 1)

  is(`a = [1, []]; a.1.0 = 2; a`, [ 1, [ 2 ] ])
  is(`a = [1, []]; a.1.0 = 2`, 2)
})
