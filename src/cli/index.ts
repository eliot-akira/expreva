import { args } from './common'
const [file] = args

// REPL

if (!file) {
  require('./repl')
} else {
  require('./runFile')
}
