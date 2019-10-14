const path = require('path')
const fs = require('fs')
const util = require('util')
const readline = require('readline')

const args = []
const options = process.argv.slice(2).reduce((o, arg) => {
  if (arg[0]!=='-') {
    args.push(arg)
  } else {
    const [key, value = true] = arg.slice(1).split('=')
    o[key] = value
  }
  return o
}, {})

const [file] = args

// REPL

if (!file) {
  require('./repl')
  return
}

// Run file

const cwd = process.cwd()
const expreva = require('../build/expreva')

const log = o => console.log(
  typeof o!=='object' ? o
    : util.inspect(o, { showHidden: false, depth: null, colors: true })
)

function renderInstructions(instr) {
  var str = ''
  instr = instr || []
  for (let i=0, len=instr.length; i < len; i++) {
    str += instr[i]+'\n'
  }
  return str
}

let mode = options.p ? 'parse' : 'eval'

const runFile = file => {

  let source
  try {
    source = fs.readFileSync(path.join(cwd, `${file}.expr`), 'utf8')
  } catch(e) {
    console.log('Error loading file', file)
    console.log(e)
    process.exit(1)
  }
  try {

    // Parse or evaluate

    mode==='parse'
      ? console.log(renderInstructions(expreva.parse(source)))
      : log(expreva.evaluate(source, {}))
  } catch(e) {
    console.log(e.message || e)
  }
}

runFile(file)
if (!options.w) process.exit()

// Watch mode

const reader = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: ''
})

console.log('Press enter to load file and run again, ".p" for parse mode, ".e" for eval mode, "." to exit')

reader.on('line', str => {
  if (str==='.') {
    reader.close()
    process.exit()
  }
  if (str==='.p') {
    mode = 'parse'
  } else if (str==='.e') {
    mode = 'eval'
  }
  runFile(file)
})
