const path = require('path')
const fs = require('fs')
const readline = require('readline')
const util = require('util')

const cwd = process.cwd()
const log = o => console.log(util.inspect(o, { showHidden: false, depth: null, colors: true }))
const libPath = path.resolve(path.join(__dirname, '..', 'build', 'expreva.js'))

console.log('Welcome to Expreva\nEnter "." for block mode and to run block, ".." to exit')

const reader = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '> '
})

reader.prompt()

let expreva
let mode = 'line' // block
let block = ''

const load = () => {
  delete require.cache[libPath]
  expreva = require(libPath)
  assignScope()
  return expreva
}

load()

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
    reload: load
  })
}

const run = source => {
  try {
    const result = expreva.evaluate(source)
    if (result!=null && result!=='') log(result)
  } catch(e) {
    console.log(e.message)
  }
}

reader
  .on('line', (line) => {

    const source = line.trim()

    if (mode==='block') {
      if (source==='.') {
        run(block)
        block = ''
      } else if (source==='..') {
        mode = 'line'
        reader.setPrompt('> ')
      } else {
        block += source
      }
    } else {
      switch (source) {
      case '.':
        block = ''
        mode = 'block'
        reader.setPrompt('')
        break
      case '..':
        reader.close()
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
