const {lpFormat} = require('../lib/lpFormat')
const {segmentsFormat} = require('../lib/segmentsFormat')
const {lpSegmentMerge} = require('../lib/helper')
const {segments} = require('../db/segments')

const config = require('plain-config')()
const {lp} = require('../db/landingPages')
const {adUnits} = require('../db/adUnits')
const {dimension} = require('../db/dimension')
const {getRandomSites} = require('../api/randomSites')
const {getDevices} = require('../api/devices')
const {getOSes} = require('../api/oSes')
const {advertisersProducts} = require('../db/advertisersProducts')
const {affInfo} = require('../db/affInfo')
const {campaigns} = require('../db/campaigns')
const {smartAd} = require('../db/smartAd')
const {creatives} = require('../db/creatives')
const {cGroup} = require('../db/cGroup')
const {cgroupSegment} = require('../db/cgroupSegment')
const {affiliateWebsites} = require('../db/affiliateWebsites')
// third_party : result.third_party,
//     dimensions: result.dimensions,
//     randomSites: result.randomSites,
//     devices: result.devices,
//     OSes: result.OSes,
//     advertisers_products: result.advertisers_products,
//     landing_pages: result.landingPages,
//     aff_info: result.aff_info,
//     campaigns: result.campaigns,
//     segments: result.segments,
//     adUnits: result.adUnits,
//     smart_ad: result.smart_ad,
//     creatives: result.creatives,
//     c_group: result.c_group,
//     c_group_segment: result.c_group_segment,
//     affiliate_websites: result.affiliate_websites,
//
const recipeDb = async () => {
    console.time('recipeDbTime')
    let segmentsData = await segmentsFormat()
    let lpData = await lpFormat()
    let recipeDb = lpSegmentMerge(segmentsData, lpData)
    let recipeData = {}
    recipeData.recipe = recipeDb
    let maps = {}
    maps.dimensions = await dimension()
    // maps.randomSites = await getRandomSites()
    maps.devices = await getDevices()
    maps.OSes = await getOSes()
    maps.advertisers_products = await advertisersProducts()
    maps.landing_pages = await lp()
    maps.aff_info = await affInfo()
    maps.campaigns = await campaigns()
    maps.segments = await segmentsFormat()
    maps.adUnits = await adUnits()
    maps.smart_ad = await smartAd()
    maps.creatives = await creatives()
    maps.c_group = await cGroup()
    maps.c_group_segment = await cgroupSegment()
    maps.affiliate_websites = await affiliateWebsites()

    // console.log('maps.randomSites keys:',Object.keys(maps.randomSites))
    // console.log('maps.affiliate_websites keys:',Object.keys(maps.affiliate_websites).length)
    recipeData.maps = maps
    console.log('\n')
    console.timeEnd('recipeDbTime')
    return recipeData
}

module.exports = {
    recipeDb,
}