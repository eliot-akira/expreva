import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import babel from 'rollup-plugin-babel'
import pkg from './package.json'

const extensions = ['.js', '.json', '.ts']
const commonOptions = {
  output: {
    format: 'umd',
    //exports: 'named', // Mixing named and default exports
    sourcemap: true,
  },
  watch: {
    clearScreen: false
  },
  plugins: [
    resolve({
      extensions
    }),
    commonjs(),
    babel({

      // Workaround to allow function default parameters with public/private to assign to this
      // https://github.com/babel/babel/issues/7074
      passPerPreset: true,

      presets: [
        '@babel/preset-typescript',
        ['@babel/preset-env', {
          'targets': {
            'browsers': ['> 0.25%, not dead', 'not ie 11', 'not op_mini all']
          },
          'useBuiltIns': 'usage',
          'corejs': '3',
          'modules': false
        }]
      ],
      plugins: [
        '@babel/plugin-proposal-class-properties'
      ],
      exclude: [
        'build/**',
        'node_modules/**'
      ],
      extensions
    })
  ]
}

export default [
  {
    ...commonOptions,
    input: 'src/index.ts',
    output: {
      ...commonOptions.output,
      name: 'expreva',
      file: pkg.browser,
    }
  },
  {
    ...commonOptions,
    input: 'src/extend/math.ts',
    output: {
      ...commonOptions.output,
      name: 'expreva.math',
      file: 'build/expreva.math.js',
    },
  },
  // lodash/fp
  // @see https://github.com/lodash/lodash/wiki/FP-Guide
  {
    ...commonOptions,
    input: 'src/extend/lodash.ts',
    output: {
      ...commonOptions.output,
      name: 'expreva.lodash',
      file: 'build/expreva.lodash.js',
    },
  },
]
