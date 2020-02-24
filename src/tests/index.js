const { waitKeyPressAndReload } = require('testra')

const main = () => require('./all')()

main().then(() => waitKeyPressAndReload(main))