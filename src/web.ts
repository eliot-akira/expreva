import * as expreva from './index'

declare var window: {
  expreva: typeof expreva
}

window.expreva = expreva
