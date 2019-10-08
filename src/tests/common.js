const expreva = require('../../build/expreva')

const parse = (...args) => {
  try {
    return expreva.parse(...args)
  } catch(e) {
    console.log(e.message)
    return e
  }
}

const evaluate = (...args) => {
  try {
    return expreva.evaluate(...args)
  } catch(e) {
    console.log(e.message)
    return e
  }
}

module.exports = { parse, evaluate }