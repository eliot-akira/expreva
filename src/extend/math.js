// import { factorial } from '../functions'

// Global library
if ('undefined'!==typeof window && 'undefined'!==typeof window.expreva) {
  extend(window.expreva)
}

// Module
export default function extend(expreva) {

  if (expreva.scope.math) return

  Object.assign(expreva.scope, {
    math: {
      random: random,
      isInteger,
      min: Math.min,
      max: Math.max,
      sin: Math.sin,
      cos: Math.cos,
      tan: Math.tan,
      asin: Math.asin,
      acos: Math.acos,
      atan: Math.atan,
      sinh: Math.sinh || sinh,
      cosh: Math.cosh || cosh,
      tanh: Math.tanh || tanh,
      asinh: Math.asinh || asinh,
      acosh: Math.acosh || acosh,
      atanh: Math.atanh || atanh,
      sqrt: Math.sqrt,
      log: Math.log,
      ln: Math.log,
      lg: Math.log10 || log10,
      log10: Math.log10 || log10,
      abs: Math.abs,
      ceil: Math.ceil,
      floor: Math.floor,
      round: Math.round,
      roundTo,
      trunc: Math.trunc || trunc,
      hypot: Math.hypot || hypot,
      pow: Math.pow,
      atan2: Math.atan2,
      //gamma,
    }
  })
}

function sinh(a) {
  return ((Math.exp(a) - Math.exp(-a)) / 2)
}

function cosh(a) {
  return ((Math.exp(a) + Math.exp(-a)) / 2)
}

function tanh(a) {
  if (a === Infinity) return 1
  if (a === -Infinity) return -1
  return (Math.exp(a) - Math.exp(-a)) / (Math.exp(a) + Math.exp(-a))
}

function asinh(a) {
  if (a === -Infinity) return a
  return Math.log(a + Math.sqrt((a * a) + 1))
}

function acosh(a) {
  return Math.log(a + Math.sqrt((a * a) - 1))
}

function atanh(a) {
  return (Math.log((1 + a) / (1 - a)) / 2)
}

function log10(a) {
  return Math.log(a) * Math.LOG10E
}

function trunc(a) {
  return a < 0 ? Math.ceil(a) : Math.floor(a)
}

function isInteger(value) {
  return isFinite(value) && (value === Math.round(value))
}

function random(a) {
  return Math.random() * (a || 1)
}

function hypot() {
  var sum = 0
  var larg = 0
  for (var i = 0; i < arguments.length; i++) {
    var arg = Math.abs(arguments[i])
    var div
    if (larg < arg) {
      div = larg / arg
      sum = (sum * div * div) + 1
      larg = arg
    } else if (arg > 0) {
      div = arg / larg
      sum += div * div
    } else {
      sum += arg
    }
  }
  return larg === Infinity ? Infinity : larg * Math.sqrt(sum)
}

/**
* Decimal adjustment of a number.
* From @escopecz.
*
* @param {Number} value The number.
* @param {Integer} exp  The exponent (the 10 logarithm of the adjustment base).
* @return {Number} The adjusted value.
*/
function roundTo(value, exp) {
  // If the exp is undefined or zero...
  if (typeof exp === 'undefined' || +exp === 0) {
    return Math.round(value)
  }
  value = +value
  exp = -(+exp)
  // If the value is not a number or the exp is not an integer...
  if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
    return NaN
  }
  // Shift
  value = value.toString().split('e')
  value = Math.round(+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)))
  // Shift back
  value = value.toString().split('e')
  return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp))
}

/*
var GAMMA_G = 4.7421875
var GAMMA_P = [
  0.99999999999999709182,
  57.156235665862923517, -59.597960355475491248,
  14.136097974741747174, -0.49191381609762019978,
  0.33994649984811888699e-4,
  0.46523628927048575665e-4, -0.98374475304879564677e-4,
  0.15808870322491248884e-3, -0.21026444172410488319e-3,
  0.21743961811521264320e-3, -0.16431810653676389022e-3,
  0.84418223983852743293e-4, -0.26190838401581408670e-4,
  0.36899182659531622704e-5
]

// Gamma function from math.js
function gamma(n) {
  var t, x

  if (isInteger(n)) {
    if (n <= 0) {
      return isFinite(n) ? Infinity : NaN
    }

    if (n > 171) {
      return Infinity // Will overflow
    }

    var value = n - 2
    var res = n - 1
    while (value > 1) {
      res *= value
      value--
    }

    if (res === 0) {
      res = 1 // 0! is per definition 1
    }

    return res
  }

  if (n < 0.5) {
    return Math.PI / (Math.sin(Math.PI * n) * gamma(1 - n))
  }

  if (n >= 171.35) {
    return Infinity // will overflow
  }

  if (n > 85.0) { // Extended Stirling Approx
    var twoN = n * n
    var threeN = twoN * n
    var fourN = threeN * n
    var fiveN = fourN * n
    return Math.sqrt(2 * Math.PI / n) * Math.pow((n / Math.E), n) *
      (1 + (1 / (12 * n)) + (1 / (288 * twoN)) - (139 / (51840 * threeN)) -
      (571 / (2488320 * fourN)) + (163879 / (209018880 * fiveN)) +
      (5246819 / (75246796800 * fiveN * n)))
  }

  --n
  x = GAMMA_P[0]
  for (var i = 1; i < GAMMA_P.length; ++i) {
    x += GAMMA_P[i] / (n + i)
  }

  t = n + GAMMA_G + 0.5
  return Math.sqrt(2 * Math.PI) * Math.pow(t, n + 0.5) * Math.exp(-t) * x
}
*/