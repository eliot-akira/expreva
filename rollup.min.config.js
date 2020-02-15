import { terser } from 'rollup-plugin-terser'
import config from './rollup.config'

export default config.map(({ input, output, external, watch, plugins }) => {
  return {
    input,
    watch,
    external,
    output,
    plugins: [
      ...plugins,
      terser({
        compress: true,
        mangle: true,
        //keep_fnames: true // For built-in and library function names
      })
    ]
  }
})
