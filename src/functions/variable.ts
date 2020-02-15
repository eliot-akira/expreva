
export function set(obj, name?: string | object, value?) {

  if (typeof name==='undefined') return (...args) => set(obj, ...args)

  if (typeof obj==='string') {

    // Variable assignment

    if (obj==='local') {
      Object.assign(this.local.scope, name)
    } else if (obj==='global') {
      Object.assign(this.global.scope, name)
    } else {

      // TODO: Reconsider global/local variables
      // Perhaps use ":=" as setCreate to ensure global assignment?

      this.global.scope[obj] = name
    }

    // Anonymous function inherits variable name
    if (name instanceof Function && (!name.name || name.name==='anonymous')) {
      Object.defineProperty(name, 'name', {
        value: obj,
        writable: false
      })
    }

    return name
  }

  if (typeof name==='object') {
    Object.assign(obj, name)
  } else {
    obj[name] = value
  }
  return obj
}

// { [key: string]: any }
export function unset(obj, name?: string | number, count?: number) {

  if (typeof name==='undefined') return (...args) => unset(obj, ...args)

  if (Array.isArray(obj)) {
    // Remove item by index
    return obj.splice(name as number, count || 1)
    // Remove item by reference?
  }

  if (typeof name==='string') {
    // Remove variable from local scope
    delete this.local.scope[name]
    return
  }

  delete obj[name]
  return obj
}

export function get(obj, name) {
  if (typeof obj==='string') {
    return typeof this.local.scope[obj]!=='undefined'
      ? this.local.scope[obj]
      : this.global.scope[obj]
  }
  return obj[name]
}

export function use(name) {
  // Extract all keys from an object into local variables
  // If given a string, it will look for a variable of that name in the global scope
  const obj =
    typeof name==='string'
      ? this.global.scope[name]
      : name
  if (!obj || typeof obj!=='object') return obj
  Object.assign(this.local.scope, obj)
  return obj
}
