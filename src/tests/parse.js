const { parse, evaluate, toString } = require('./common')

// test('parse', it => {

//   let instructions = parse('1+1')

//   it('parses', instructions)
//   it('returns instructions', it.is(instructions, ['+', 1, 1]))
//   it('instructions are evaluated', it.is(evaluate(instructions), 2), instructions)
// })

// test('parse invalid', it => {
//   const exprs = [
//     '(',
//     ')',
//     '}',
//     ']',
//     '.',
//     ',',
//     '->',
//     '?',
//     ':'
//   ]

//   for (const expr of exprs) {
//     it(expr, it.throws(() => parse(expr)) || it.is(parse(expr), []))
//   }

//   it('{', it.is(parse('{'), ['obj']))
//   it('[', it.is(parse('['), ['list']))
// })

// test('parse valid', it => {
//   const exprs = [
//     '()',
//     '1->()',
//     'f=x=>x;f(1)',
//     'true?1:0',
//     '{a:1}',
//     '[]',
//     '[1,2]',
//     '{}',
//     'a={};a.b',
//   ]

//   for (const expr of exprs) {
//     it(expr, !it.throws(() => parse(expr)))
//   }
// })


test('parse statements', it => {
  const exprs = {

    // '[ 1 + 2 ]': '(list (+ 1 2))',
    // '[ 1 + 2, 3 + 4 ]': '(list (+ 1 2) (+ 3 4))',
    // '[ () => 1 + 2, 3 + 4 ]': '(list (λ () (+ 1 2)) (+ 3 4))',

    // '[1, x=>x*x+5, 5]': '(list 1 (λ (x) (+ (* x x) 5)) 5)',
    '[1, (x=>x*x+5), 5]': '(list 1 (λ (x) (+ (* x x) 5)) 5)',


    // '{ a: 1 + 2 }': '(obj (a (+ 1 2)))',

    // 'f': 'f',
    // 'f()': '(f)',
    // 'f(1)': '(f 1)',

    // 'f(1;2)': '(f (do 1 2))',
    // 'f((1;2),3)': '(f (do 1 2) 3)',
    // 'f((1;2))': '(f (do 1 2))',
    // 'f(1, (2;3))': '(f 1 (do 2 3))',

    // // No semicolons
    // '1 2 3': '(do 1 2 3)',
    // '(1 2 3)': '(do 1 2 3)',
    // '(1 2+3 4)': '(do 1 (+ 2 3) 4)',
    // 'f=x=>(1 ()=>() 2 3)': '(def f (λ (x) (do 1 (λ ()) 2 3)))',


    // 'a={};b={};c={}': '(do (def a (obj)) (def b (obj)) (def c (obj)))',

    // '()=>3': '(λ () 3)',
    // 'x=>3': '(λ (x) 3)',
    // '(x)=>3': '(λ (x) 3)',
    // '(x,y,z)=>x+y+z': '(λ (x y z) (+ (+ x y) z))',

    // 'x => (a;b;c)': '(λ (x) (do a b c))',

    // 'f=x=>x;f(1)': '(do (def f (λ (x) x)) (f 1))',
    // '(f=x=>x);f(1)': '(do (def f (λ (x) x)) (f 1))',
    // 'f=x=>x;1->f': '(do (def f (λ (x) x)) (f 1))',
    // 'f=x=>x;(1)->f': '(do (def f (λ (x) x)) (f 1))',
    // 'f=x=>x;(1,2)->f': '(do (def f (λ (x) x)) (f 1 2))',

    // '3 -> x => x * x': '((λ (x) (* x x)) 3)',
    // '3->(x => x)': '((λ (x) x) 3)',
    // '3->(x => x) * 3': '(* ((λ (x) x) 3) 3)',
    // '3->(x => x * 3)': '((λ (x) (* x 3)) 3)',
    // 'f=()=>2;f': '(do (def f (λ () 2)) f)',

    // 'f(1,()=>2)': '(f 1 (λ () 2))',
    // 'f(1,x=>2)': '(f 1 (λ (x) 2))',
    // 'f(1,(x,y)=>2)': '(f 1 (λ (x y) 2))',
    // 'f(1,(x,y)=>2);f(3)': '(do (f 1 (λ (x y) 2)) (f 3))',

    // 'f=x=>(x>0;x=x-1)': '(def f (λ (x) (do (> x 0) (def x (- x 1)))))',
    // 'f=x=>(x>0;x=x-1);f(1)': '(do (def f (λ (x) (do (> x 0) (def x (- x 1))))) (f 1))',

  }

  for (const key of Object.keys(exprs)) {
    const result = toString(parse(key))
    it(key, it.is(result, exprs[key]), 'expected', exprs[key], 'actual', result)
  }
})
