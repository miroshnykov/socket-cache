const {
    resolveLocation,
    mapByPriorityNDimension
} = require('./helper')
const {cities} = require('../db/cities')
const {segments} = require('../db/segments')

const segmentsFormat = async () => {
    return await mapByPriorityNDimension(await resolveLocation(await segments(), await cities()))
}

module.exports = {
    segmentsFormat,
}