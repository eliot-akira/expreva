const { eva } = require('./common')

test('assignment', it => {

  const is = eva(it)

  is(`a = {} a.b = 'hi' a `, { b: 'hi' })
  is(`a=[1] b=[2] b`, [2])

})

test('compound assignment', it => {

  const is = eva(it)

  is(`x = 1 x++`, 2)
  is(`x = 1 x--`, 0)
  is(`x = 1 x+=2`, 3)
  is(`x = 1 x-=2`, -1)
  is(`x = 1 x*=2`, 2)
  is(`x = 1 x/=2`, .5)

  is(`a = { b: 1 } a.b += a.b a`, { b: 2 })
})
