import { test, runTests } from 'testra'
import { parse, evaluate, toString } from '../index'
import util from 'util'

const inspect = obj => util.inspect(obj, false, null, true)

global.test = test

// require('./parse')
// require('./arithmetic')
require('./assignment')

export default runTests()
