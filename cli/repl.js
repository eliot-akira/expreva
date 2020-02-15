const path = require('path')
const fs = require('fs')
const readline = require('readline')
const common = require('./common')
const {
  cwd, args, options,
  log, renderInstructions,
  loadExpreva
} = common
let { expreva } = common

console.log('Welcome to Expreva\nEnter ".b" to enter block mode, ".p" to toggle parse/eval mode, "." to run block, ".." to exit')

const reader = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '> '
})

reader.prompt()

let inputMode = 'line' // block
let runMode = 'eval'
let block = ''

function assignScope() {
  Object.assign(expreva.scope, {
    clear() {
      process.stdout.write('\x1Bc')
    },
    parse(str) {
      return expreva.parse(str)
    },
    eva(str) {
      return expreva.evaluate(str)
    },
    load(src) {
      return fs.readFileSync(path.join(cwd, `${src}.expr`), 'utf8')
    },
    print(...args) {
      console.log(...args)
    },
    reload: () => {
      expreva = loadExpreva()
      assignScope()
    }
  })
}

assignScope()

const run = source => {
  try {
    if (runMode==='parse') {
      console.log(renderInstructions(expreva.parse(source)))
    } else {
      const result = expreva.evaluate(source)
      if (result!=null && result!=='') log(result)
    }
  } catch(e) {
    console.log(e.message)
  }
}

const setRunModePrompt = () => reader.setPrompt(
  runMode==='parse' ? 'parse> ' : '> '
)

reader
  .on('line', (line) => {

    const source = line.trim()

    if (source==='.p') {

      runMode = runMode==='parse' ? 'eval' : 'parse'

      console.log(runMode[0].toUpperCase() + runMode.slice(1) + ' mode')
      if (inputMode!=='block') setRunModePrompt()

    } else if (inputMode==='block') {

      if (source==='.') {
        run(block)
        block = ''
      } else if (source==='..') {
        inputMode = 'line'
        setRunModePrompt()
      } else {
        block += source
      }

    } else {
      switch (source) {
      case '.b':
        block = ''
        inputMode = 'block'
        reader.setPrompt('')
        break
      case '..':
        reader.close()
        break
      case '.r':
        expreva = loadExpreva()
        assignScope()
        console.log('Expreva reloaded')
        break
      default:
        run(source)
        break
      }
    }

    reader.prompt()
  })
  .on('close', () => {
    process.exit(0)
  })
  .on('SIGINT', () =>{
    console.log()
    reader.close()
  })
