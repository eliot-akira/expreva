import path from 'path'
import fs from 'fs'
import util from 'util'
import readline from 'readline'
import common from './common'
const {
  cwd, args, options,
  log, renderInstructions,
  loadExpreva
} = common
let { expreva } = common

const [file] = args

// Run file

let mode = options.p ? 'parse' : 'eval'
const runSource = source => {
  // Parse or evaluate
  try {
    mode==='parse'
      ? console.log(renderInstructions(expreva.parse(source)))
      : log(expreva.evaluate(source, {}))
  } catch(e) {
    if (typeof e!=='undefined') console.log(e.message || e)
  }
}
const runFile = file => {

  let source
  try {
    source = fs.readFileSync(path.join(cwd, `${file}.expr`), 'utf8')
  } catch(e) {
    console.log('Error loading file', file)
    //console.log(e)
    process.exit(1)
  }
  runSource(source)
}

runFile(file)
if (!options.w) process.exit()

// Watch mode - TODO: Combine with REPL

const reader = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: ''
})

console.log('Enter "." to run file again, ".p" to toggle parse/eval mode, ".." to exit')

reader.on('line', str => {
  if (str==='..') {
    reader.close()
    process.exit()
  }
  if (str==='.p') {
    mode = mode==='parse' ? 'eval' : 'parse'
    runFile(file)
  } else if (str==='.r') {
    loadExpreva()
    console.log('Expreva reloaded')
  } else if (str==='.') {
    runFile(file)
  } else runSource(str)
})
