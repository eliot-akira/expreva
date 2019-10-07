# Expreva

Expreva is a small language based on arithmetic and algebra expressions.

![](screenshot.png)

## Overview

The goal is to create a functional, extensible language with a Lisp-like simplicity.

This project was originally a fork of [`expr-eval`](https://github.com/silentmatt/expr-eval), a mathematical expression evaluator that's been ported from C to JavaScript.  It's undergoing an extensive redesign to a minimal core of a parser and interpreter, so that most of the functionality can be built with the language itself.

## Develop

#### Install dependencies

```sh
yarn
```

#### Develop

Build, watch files and rebuild

```sh
yarn dev
```

Run tests, watch files and retest

```sh
yarn test
```

This can be run in parallel with `dev` task above, i.e., in another terminal window/tab.

#### Build and minify

```sh
yarn build
```
