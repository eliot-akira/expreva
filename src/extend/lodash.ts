// https://lodash.com/docs/
// https://github.com/lodash/lodash/wiki/FP-Guide
import fp from 'lodash/fp'

declare global {
  interface Window { expreva: any }
}

// Global library
if ('undefined'!==typeof window && 'undefined'!==typeof window.expreva) {
  extend(window.expreva)
}

// Module
export default function extend(expreva) {
  const {
    __,
    __moduleExports: x,
    default: xx,
    template,
    templateSettings,
    VERSION,
    ..._
  } = fp

  Object.assign(expreva.scope, {
    _
  })
}
