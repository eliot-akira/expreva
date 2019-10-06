import {

  //concat,
  //inOperator,

  add,
  subtract,
  multiply,
  divide,
  modulo,
  negative,
  factorial,

  equal,
  notEqual,
  greaterThan,
  lessThan,
  greaterThanEqual,
  lessThanEqual,
  and,
  or,
  not,
  condition,

  get,
  set,
  unset,
  use,
  char,

  push,
  pop,
  insert,
  slice,
  search,
  size,
  keys,
  join,

  map,
  filter,
  reduce,
  repeat,

} from './index'

export const unaryOps = {
  '-': negative,
  '+': Number,
  not: not,
  '!': factorial,
}

export const binaryOps = {
  '+': add,
  '-': subtract,
  '*': multiply,
  '/': divide,
  '%': modulo,
  '^': Math.pow,
  '=': set,

  '==': equal,
  '!=': notEqual,
  '>': greaterThan,
  '<': lessThan,
  '>=': greaterThanEqual,
  '<=': lessThanEqual,

  and: and,
  or: or,
}

export const ternaryOps = {
  '?': condition
}

export const functions = {

  get,
  set,
  unset,
  use,

  push,
  pop,
  insert,
  slice,
  search,
  size,
  keys,
  join,

  map,
  filter,
  reduce,
  repeat,

  char,
  // Reconsider: if then else
  //'if': condition,
}

export const consts = {
  'true': true,
  'false': false,

  // Externalize
  E: Math.E,
  PI: Math.PI,
}
