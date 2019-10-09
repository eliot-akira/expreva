const { eva, evaluate } = require('./common')

test('list', it => {
  const is = eva(it)

  is('[ 1, 2, 3 ]', [ 1, 2, 3 ])

  is(`[ { x: 'y' } ]`, [ { x: 'y' } ])
  is(`[ 'a', 'b', { x: 'y' }, 'd' ]`, [ 'a', 'b', { x: 'y' }, 'd' ])

  let code = `[ true, 2 * 3 + 1, f = x => x * x, f(12), [ 'apples', 'oranges' ] ]`
  let result = evaluate(code)
  let f = result[2]

  it(code, it.is(result, [ true, 7, f, 144, [ 'apples', 'oranges' ] ]))
})
