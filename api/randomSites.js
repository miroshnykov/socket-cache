const config = require('plain-config')()
const axios = require('axios')
const {catchHandler} = require('../lib/catchErr')
const {randomSitesFormat} = require('../lib/helper')

const randomSitesReq = axios.create({
    baseURL: config.api.randomsites.host,
})

const getRandomSites = async () => {

    try {
        let {data} = await randomSitesReq.get(config.api.randomsites.path)

        let rs = await randomSitesFormat(data)
        let randomSites = {
            total: rs[rs.length - 1].weight,
            urls: rs
        }

        return randomSites

    } catch (e) {
        catchHandler(e, 'getRandomSites')
    }
}

module.exports = {
    getRandomSites
}