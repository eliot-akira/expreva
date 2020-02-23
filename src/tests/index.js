const { test, runTests, waitKeyPressAndReload } = require('testra')

const main = () => {

  const { eva, parse, evaluate } = require('./common')

  global.test = test

  test('expreva', it => {
    it('has method evaluate', evaluate)
    it('has method parse', parse)
  })

  require('./parse')

  require('./arithmetic')
  require('./comparison')
  require('./conditional')

  require('./assignment')

  require('./list')
  require('./object')
  require('./member')
  require('./statement')

  require('./function')
  require('./apply')
  // require('./spread')

  return runTests()
}

main().then(() => waitKeyPressAndReload(main))