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

  '!': factorial,

  // Reserved words
  not,
  'return': null,
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

  '&&': and,
  '||': or,

  and,
  or,
}

export const ternaryOps = {
  '?': condition,

  // Reserved words
  'if': condition,
  'then': null,
  'else': null,
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
}

export const consts = {
  'true': true,
  'false': false,

  // Externalize
  E: Math.E,
  PI: Math.PI,
}
