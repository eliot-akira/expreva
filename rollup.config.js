import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import babel from 'rollup-plugin-babel'
import pkg from './package.json'

const commonOptions = {
  output: {
    format: 'umd',
    //exports: 'named',
    sourcemap: true,
  },
  watch: { clearScreen: false },
  plugins: [
    resolve(),
    commonjs(),
    babel({
      exclude: [
        'build/**',
        'node_modules/**'
      ]
    })
  ]
}

export default [
  {
    ...commonOptions,
    input: 'src/index.js',
    output: {
      ...commonOptions.output,
      name: 'expreva',
      file: pkg.browser,
    }
  },
  {
    ...commonOptions,
    input: 'src/extend/math.js',
    output: {
      ...commonOptions.output,
      name: 'expreva.math',
      file: 'build/expreva.math.js',
    },
  },
]
