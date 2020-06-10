const {
    mapBySegmentID,
    resolveURL,
    distributeWeights
} = require('./helper')
const config = require('plain-config')()
const {lp} = require('../db/landingPages')

const lpFormat = async () => {
    const {target, weighting} = config.landingPage
    const {scale} = weighting
    return await distributeWeights(await mapBySegmentID(await resolveURL(await lp(), target)), scale)
}

module.exports = {
    lpFormat,
}