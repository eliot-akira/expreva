const path = require('path')
const util = require('util')

const cwd = process.cwd()
const buildPath = path.join(__dirname, '..', 'build')
const libPath = path.resolve(path.join(buildPath, 'expreva.js'))
const extensionPaths = ['math', 'lodash']
  .map(name => path.resolve(path.join(buildPath, `expreva.${name}.js`)))

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

// Log

const log = o => console.log(
  typeof o!=='object' ? o
    : util.inspect(o, { showHidden: false, depth: null, colors: true })
)

function renderInstructions(instr = []) {
  return instr.join('\n')
}

// Reloadable library

let expreva

const loadExpreva = () => {
  delete require.cache[libPath]
  expreva = require(libPath)
  extensionPaths.map(f => {
    delete require.cache[f]
    require(f)(expreva)
  })
  return expreva
}

loadExpreva()

module.exports = {
  expreva, loadExpreva,
  cwd, args, options,
  log, renderInstructions,
}