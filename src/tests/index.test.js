const { eva, parse, evaluate } = require('./common')

test('expreva', it => {
  it('has method evaluate', evaluate)
  it('has method parse', parse)
})

require('./parse')

require('./arithmetic')
require('./comparison')
require('./conditional')

require('./list')
require('./object')
require('./member')
require('./statement')

require('./function')
require('./apply')
