
const valuesSeen = new Map

export function toPrettyString(data, indent = 0) {

  var children, elem, s

  s = ''

  if (data == null || data===NaN) {
    return // "nil"
  }

  if (!indent) valuesSeen.clear()

  if (Array.isArray(data)) {
    children = []
    for (let key in data) {
      children.push(toPrettyString(data[key], indent+1))
    }
    if (children.length) {
      return "[\n"+pad(indent+1)+children.join(",\n"+pad(indent+1)) + "\n"+pad(indent)+"]"
    }

    return "[]"
  }

  if (typeof data === "number" || data instanceof Number) {
    return JSON.stringify(data)
  }

  if (typeof data === "string" || data instanceof String) {

    if (!indent) return data // String unquoted if root

    let str = JSON.stringify(data)
    str = str.substr(1, str.length-2)
    return "'" + str.replace(/'/g, "\\'") + "'"
  }

  if (typeof data === "boolean" || data instanceof Boolean) {
    return (data && "true") || "false"
  }

  if (typeof data === "function") {
    return /*data.lambda ? data.toString() :*/ data.name ? 'function '+data.name : 'function'
  }

  // Object

  // Catch circular reference
  if (valuesSeen.get(data)) {
    return '..'
  }

  valuesSeen.set(data, true)

  if (typeof data === "object" && !(data instanceof String) && Object.keys(data).length) {

    children = []

    for (let key in data) {
      var keystr = ((typeof key === "string" || key instanceof String)
        && key.search(" ") == -1
        && key.search("\"") == -1
        && key != ""
        && !Number(key) /* strings that look like numbers need to be quoted */
        && key != "0"
        && key[0] != "(" /* strings that look like lists need to be quoted */
        && key[key.length-1] != ")")
        ? key : toPrettyString(key, indent+1)

      var valstr = toPrettyString(data[key],
        indent + 1
        // indent + keystr.length + 2
      )
      var pair = `${keystr}: `+valstr
      children.push(pair)
    }

    if (children.length) {
      return "{\n"
        +pad(indent+1)+children.join(",\n"+pad(indent+1))+"\n"
        +pad(indent)+"}"
    }

    return "{}"
  }

  if (typeof data === "object" && JSON.stringify(data) == "{}") {
    return "{}"
  }

  if (typeof data === "object") {
    return JSON.stringify(data)
  }

  return (typeof data)+" "+JSON.stringify(data)
}

function pad(length, padchar = ' ') {
  return new Array(length+1).join(padchar)
}
