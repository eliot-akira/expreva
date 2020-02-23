module.exports = {
  build: [
    {
      task: 'js',
      src: 'src/web.ts',
      dest: 'build/web/expreva.min.js',
      watch: ['src/**/*.{js,ts,tsx}', '!src/tests/**']
    },
    {
      task: 'babel',
      src: 'src/**/*.{js,ts}',
      dest: 'build',
      watch: 'src/**/*.{js,ts,tsx}'
    },
  ]
}