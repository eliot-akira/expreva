import { test, runTests } from 'testra'
import { parse, evaluate, toString } from '../index'

global.test = test

require('./parse')

require('./arithmetic')
require('./assignment')
//require('./compoundAssignment')
require('./comparison')
require('./conditional')
require('./function')
require('./list')
require('./nil')

require('./object')
require('./statement')

require('./member')
require('./spread')

export default runTests()
