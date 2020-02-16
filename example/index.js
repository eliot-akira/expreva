var expreva = window.expreva

var $ = document.querySelector.bind(document)
var $$ = function(sel) {
  return Array.prototype.slice.call(document.querySelectorAll(sel))
}
var $textarea = $('.section-expression textarea')
var $runAction = $('.evaluate-button')

var $instructions = $('.section-instructions code')
var $result = $('.section-result code')
var $resultError = $('.section-error code')
var $resultErrorContainer = $('.section-error')

var env = expreva.createEnvironment()

$textarea.focus()

console.log('expreva', expreva)
if (window.location.hostname==='localhost') {
  expreva.log = true
} else {
  expreva.log = false
  console.log('To see logs, run expreva.log=true')
}

function log() {
  if(expreva.log) console.log.apply(console.log, arguments)
}

function clearText() {
  var arg
  for (var i=0, len=arguments.length; i < len; i++) {
    arg = arguments[i]
    if (!arg) {
      continue
    }
    arg.innerText = ''
  }
}

function setText(el, value) {
  el.innerText = value
}

function stringify(val) {
  return val instanceof Function
    ? 'function '+val.name+'()'
    : typeof val==='undefined'
      ? '' //'undefined'
      : Array.isArray(val)
        ? val.map(v => stringify(v)).join("\n")
        : typeof val==='object'
          ? JSON.stringify(val, function(key, value) {
            if (!key) return value
            return value instanceof Function ? stringify(value) : value
          }, 2).replace(/"/g, '\'')
          : typeof val==='string'
            ? val.replace(/"/g, '\'')
            : (val==null ? '' : val)
}

function renderInstructions(instr) {
  return expreva.toFormattedString(instr)
}

function clearError() {
  clearText($resultError)
  $resultErrorContainer.classList.add('hide')
}

function setError(msg) {
  setText($resultError, msg)
  $resultErrorContainer.classList.remove('hide')
}

var lastExpression

function render() {

  var expression, instructions, result

  expression = $textarea.value
  // if (expression===lastExpression) return

  lastExpression = expression

  try {

    instructions = expreva.parse(expression, env)

    if (!instructions) {
      log('Empty result after parse')
      clearText($instructions, $result, $resultError)
      return
    }

    $instructions.innerText = renderInstructions(instructions)

    log('Parsed', instructions)
    clearError()

  } catch(e) {

    log('Parse error', e)
    setError(e.message)

    // Partially parsed Instructions
    $instructions.innerText = renderInstructions(expreva.instructions)

    clearText($result)
  }

  try {

    result = expreva.evaluate(instructions, env)

    log('Result', result)

    setText($result, stringify(result))
    clearError()

  } catch(e) {
    log('Evaluate error', e)
    clearText($result)
    setError(e.message)
  }

}

var debounce = function(fn, duration) {
  var timer = null
  return function() {
    if (!timer) return fn()
    clearTimeout(timer)
    timer = setTimeout(fn, duration)
  }
}

var scheduleRender = debounce(render, 10)

$runAction.addEventListener('click', function() {
  scheduleRender()
  $textarea.focus()
})

$textarea.addEventListener('keyup', () => setTimeout(render(), 0))

function renderExpr(el) {
  $textarea.value = el.innerText
  $textarea.focus()
  scheduleRender()
}

$$('code.expr').map(function(el) {
  el.addEventListener('click', function() {
    lastExpression = ''
    renderExpr(el)
  })
})

scheduleRender()
