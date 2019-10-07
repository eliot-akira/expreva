import { uglify } from 'rollup-plugin-uglify'
import config from './rollup.config'

export default config.map(({ input, output, external, watch, plugins }) => {
  return {
    input,
    watch,
    external,
    output,
    plugins: [
      ...plugins,
      uglify({
        keep_fnames: true
      })
    ]
  }
})
