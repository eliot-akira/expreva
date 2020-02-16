# Expreva

Expreva is a language based on arithmetic and algebra expressions.

![](screenshot.png)

## Overview

This is a parser and interpreter for the [Expreva language](https://expreva.com/), written in TypeScript.

Expreva is a cross-platform, modular and extensible language and virtual machine. The source code is compiled to a compact, JSON-serializable format, suitable for transfer over HTTP, WebSocket, or inter-process communication.

It's an exploration in progress, to design a suitable medium for end-user programming, for example: in a spreadsheet formula; as a data transport or query protocol; dynamic content creation such as web documents and interactive textbooks.

The goal is to stay simple enough to learn and implement. Currently it runs in the web browser, servide-side on Node.js and PHP. An eventual plan is to compile to WebAssembly.

### Parser

The default grammar is based on infix notation, a superset of commonly used arithmetic statements.

The parser produces a syntax tree of symbolic expressions in prefix notation, as in Lisp.

#### References

- [Top Down Operator Precedence - Vaughan R. Pratt](https://tdop.github.io/) (The original paper)
- [Top-Down operator precedence parsing - Eli Bendersky](https://eli.thegreenplace.net/2010/01/02/top-down-operator-precedence-parsing/) (Excellent overview of the algorithm with examples in Python)
- [Top Down Operator Precedence - Douglas Crockford](http://crockford.com/javascript/tdop/tdop.html) (Fundametal concepts used in JSLint to parse JavaScript)

### Interpreter

The interpreter is based on a study of [make-a-lisp](https://github.com/kanaka/mal), with support for lexical scope, lambda, macro, conditions, and tail-call optimization.

Compiled expressions are evaluated in an isolated runtime environment, and allows passing objects and functions to and from the host.

Note: More work is needed to ensure safe evaluation, such as limiting the number of operations and time to live.


## Develop

#### Install dependencies

```sh
yarn
```

#### Develop

Build, watch files and rebuild. This also starts a dev server with a page to test expressions.

```sh
yarn dev
```

Run tests and wait for user input to rerun.

```sh
yarn test
```

This can be run in parallel with `dev` task above (in another terminal process) for test-driven development.

Type-check, watch files and rerun.

```sh
yarn type
```

#### Build and minify

```sh
yarn build
```
