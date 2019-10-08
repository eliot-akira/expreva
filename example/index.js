var expreva = window.expreva

var $ = document.querySelector.bind(document)
var $$ = function(sel) {
  return Array.prototype.slice.call(document.querySelectorAll(sel))
}
var $textarea = $('.section-expression textarea')
var $runAction = $('.evaluate-button')

var $instructions = $('.section-instructions code')
// var $parsed = $('.expreva-parsed code')
// var $parsedError = $('.expreva-parsed-error')
var $result = $('.section-result code')
var $resultError = $('.section-error error')

// See https://github.com/silentmatt/expr-eval

var scope = {}

$textarea.focus()
//$doc.tabIndex = '0'
//$doc.focus()

console.log('Expreva', expreva)
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
  var str = ''
  instr = instr || []
  for (let i=0, len=instr.length; i < len; i++) {
    str += instr[i]+'\n'
  }
  return str
}

var lastExpression

function render() {

  //$textarea.focus()
  var expression = $textarea.value
  if (expression===lastExpression) return

  lastExpression = expression

  var parsed, result
  try {

    parsed = expreva.parse(expression, scope)

    //if (typeof parsed==='undefined' || !(parsed.instructions)) return
    if (typeof parsed==='undefined' || parsed==='') {
      log('Empty result after parse')
      clearText($instructions, /*$parsed, $parsedError,*/ $result, $resultError)
      return
    }

    $instructions.innerText = renderInstructions(parsed.instructions) //JSON.stringify(parsed.instructions || [], null, 2)

    if (parsed instanceof Error) {
      log('Parse error', parsed)
      clearText(/*$parsed, */$result /*, $resultError*/)
      //setText($parsedError, parsed.toString())
      setText($resultError, parsed.toString())
      return
    }

    log('Parsed', parsed)

    // setText($parsed, parsed.toString())
    clearText($resultError)

    try {

      result = parsed.evaluate(scope)

      log('Result', result)

      setText($result, stringify(result))
      clearText($resultError)

    } catch(e) {
      log('Evaluate error', e)
      clearText($result)
      setText($resultError, e.message)
    }
  } catch(e) {
    log('Parse error', e)
    // setText($parsedError, 'Error: '+e.message)
    setText($resultError, e.message)

    // Instructions parsed before error
    $instructions.innerText = renderInstructions(expreva.instructions)

    clearText(/*$instructions, /*$parsed,*/ $result /*, $resultError*/)
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

var scheduleRender = debounce(render, 50)

$runAction.addEventListener('click', function() {
//$textarea.addEventListener('keyup', function(e) {
  scheduleRender()
  //render()
})

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
