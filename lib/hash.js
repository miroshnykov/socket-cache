const {createHash} = require('crypto')

const hash = () => (createHash('md5').digest('hex'))

module.exports = {hash}
