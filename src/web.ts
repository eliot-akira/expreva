import expreva, { Expreva } from './index'

declare var window: {
  expreva: Expreva
}

declare var global: {
  expreva: Expreva
}
if (typeof window!='undefined') {
  window.expreva = expreva
} else if (typeof module!=='undefined') {
  console.log('here', expreva)
  module.exports = expreva
} else {
  global.expreva = expreva
}