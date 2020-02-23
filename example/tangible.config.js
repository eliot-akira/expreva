module.exports = {
  build: [
    {
      task: 'js',
      src: 'src/index.ts',
      dest: 'build/index.js',
      watch: ['src/**/*.{js,ts,tsx}', '../src/**/*.{js,ts,tsx}', '!../src/tests/**']
    },
    {
      task: 'sass',
      src: 'src/index.scss',
      dest: 'build/index.css',
      watch: ['src/**/*.scss', '../src/**/*.scss']
    },
    {
      task: 'html',
      src: 'src/**/*.html',
      dest: 'build',
      watch: 'src/**/*.html'
    }
  ],
  serve: {
    dir: 'build',
    port: 3000,
    reload: true
  }
}