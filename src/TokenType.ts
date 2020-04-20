export enum TokenType {

  space = 'space',
  newLine = 'newLine',

  number = 'number',
  symbol = 'symbol',
  string = 'string',
  comment = 'comment',

  openExpression = 'openExpression',
  closeExpression = 'closeExpression',

  openObject = 'openObject',
  closeObject = 'closeObject',
  member = 'member',

  openList = 'openList',
  closeList = 'closeList',

  endStatement = 'endStatement',

  commaSeparator = 'commaSeparator',
  colonSeparator = 'colonSeparator',

  assignment = 'assignment',

  unaryOperator = 'unaryOperator',
  binaryOperator = 'binaryOperator',

  apply = 'apply',
  lambda = 'lambda',

  undefined = 'undefined'
}
