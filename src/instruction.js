export const INUMBER = 'INUMBER'
export const IOP1 = 'IOP1'
export const IOP2 = 'IOP2'
export const IOP3 = 'IOP3'
export const IVAR = 'IVAR'
export const IVARNAME = 'IVARNAME'
export const IFUNDEF = 'IFUNDEF'
export const IFUNDEFANON = 'IFUNDEFANON'
export const IFUNCALL = 'IFUNCALL'
export const IFUNAPPLY = 'IFUNAPPLY'
export const IEXPR = 'IEXPR'
export const IMEMBER = 'IMEMBER'
export const IARRAY = 'IARRAY'
export const IOBJECT = 'IOBJECT'
export const IENDSTATEMENT = 'IENDSTATEMENT'

// Only used inside evaluate
export const IRETURN = 'IRETURN'
export const IEXPREVAL = 'IEXPREVAL'

export class Instruction {
  constructor(type, value) {
    this.type = type
    this.value = (value !== undefined && value !== null) ? value : 0
  }
  toString(indent = 0) {
    switch (this.type) {
    case INUMBER:
      if (typeof this.value === 'boolean')
        return 'Boolean ' + this.value
      if (typeof this.value === 'string')
        return 'String ' + this.value
      return 'Number ' + this.value
    case IOP1:
      return 'Operation with 1 argument ' + this.value
    case IOP2:
      return 'Operation with 2 arguments ' + this.value
    case IOP3:
      return 'Operation with 3 arguments ' + this.value
    case IVAR:
      return 'Variable ' + this.value
    case IVARNAME:
      return 'Variable name ' + this.value
    case IEXPR:
      return 'Expression\n' + instrArrayToString(this.value, indent + 2) //+'\n'
    case IENDSTATEMENT:
      return 'End statement'// + this.value
    case IFUNCALL:
      return 'Call function with ' + this.value + ' argument' + plural(this.value)
    case IFUNDEF:
      return 'Define function with ' + this.value + ' argument' + plural(this.value)
    case IFUNDEFANON:
      return 'Define anonymous function with ' + this.value + ' argument' + plural(this.value)
    case IFUNAPPLY:
      return 'Apply to function ' + this.value
      //(typeof this.value==='string' ? this.value : 'to ' + this.value) //+ ' argument' + plural(this.value)
    case IMEMBER:
      return 'Member ' + this.value
    case IARRAY:
      return 'Array of ' + this.value + ' item' + plural(this.value)
    case IOBJECT:
      return 'Object with ' + this.value + ' key-value pair' + plural(this.value)
    default:
      return this.type + ' ' + this.value //'Invalid Instruction'
    }
  }
}

function instrArrayToString(arr, indent = 2) {
  return arr.map(val => ' '.repeat(indent)+val.toString(indent)).join('\n')
}

function instrObjToString(obj, indent = 2) {
  return Object.keys(obj).map(key => ' '.repeat(indent)+key.toString(indent)+': '+obj[key].toString(indent)).join('\n')
}

function plural(val) {
  return val > 1 ? 's' : ''
}


export function unaryInstruction(value) {
  return new Instruction(IOP1, value)
}

export function binaryInstruction(value) {
  return new Instruction(IOP2, value)
}

export function ternaryInstruction(value) {
  return new Instruction(IOP3, value)
}
