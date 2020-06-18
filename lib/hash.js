const {createHash} = require('crypto')
const {currentTime} = require('./helper')

const hash = () => (createHash('md5').update(currentTime()).digest('hex'))

module.exports = {hash}
