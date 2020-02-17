const { parse, evaluate, toString } = require('./common')

test('parse', it => {

  let instructions = parse('1')

  it('parses', instructions)
  it('returns instructions', it.is(instructions, [1]))
  it('instructions are evaluated', it.is(evaluate(instructions), 1), instructions)
})

test('parse invalid', it => {
  const exprs = [
    '(',
    ')',
    '{',
    '}',
    '[',
    ']',
    '.',
    ',',
    '->',
    '?',
    ':'
  ]

  for (const expr of exprs) {
    it(expr, it.throws(() => parse(expr)) || it.is(parse(expr), []))
  }
})

test('parse valid', it => {
  const exprs = [
    '()',
    '1->()',
    'f=x=>x;f(1)',
    'true?1:0',
    // '{a:1}',
    // '[]',
    // '[1,2]',
    // '{}',
    // 'a={} a.b',
  ]

  for (const expr of exprs) {
    it(expr, !it.throws(() => parse(expr)))
  }
})

test('parse statements', it => {
  const exprs = {
    'f=x=>x;f(1)': '(do (def f (lambda x x)) (f 1))',
    '(f=x=>x);f(1)': '(do (def f (lambda x x)) (f 1))',
    'f=x=>x;1->f': '(do (def f (lambda x x)) (f 1))',
    'f=x=>x;(1)->f': '(do (def f (lambda x x)) (f 1))',
    'f=x=>x;(1,2)->f': '(do (def f (lambda x x)) (f 1 2))',
    '3 -> x => x * x': '((lambda x (* x x)) 3)',
    '3->(x => x)': '((lambda x x) 3)',
    '3->(x => x) * 3': '(* ((lambda x x) 3) 3)',
    '3->(x => x * 3)': '((lambda x (* x 3)) 3)',
    'f=x=>(x>0;x=x-1)': '(def f (lambda x (do (> x 0) (def x (- x 1)))))',
    'f=x=>(x>0;x=x-1);f(1)': '(do (def f (lambda x (do (> x 0) (def x (- x 1))))) (f 1))',
  }

  for (const key of Object.keys(exprs)) {
    it(key, it.is(toString(parse(key)), exprs[key]))
  }
})
