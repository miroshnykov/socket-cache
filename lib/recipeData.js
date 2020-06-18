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
const {memorySizeOf} = require('./helper')
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

    let sizeOfSegmentsData = await memorySizeOf(segmentsData)
    console.log(` *** size Of sizeOfSegmentsData: { ${sizeOfSegmentsData} }`)

    let lpData = await lpFormat()

    let sizeOfLpData = await memorySizeOf(lpData)
    console.log(` *** size Of sizeOfLpData: { ${sizeOfLpData} }`)

    let recipeDb = lpSegmentMerge(segmentsData, lpData)
    let sizeOfLpSegmentMerge = await memorySizeOf(recipeDb)
    console.log(` *** size Of sizeOfLpSegmentMerge: { ${sizeOfLpSegmentMerge} }`)

    let recipeData = {}
    recipeData.recipe = recipeDb
    let maps = {}
    maps.dimensions = await dimension()
    let sizeOfDimensions = await memorySizeOf(maps.dimensions)
    console.log(` *** size Of sizeOfDimensions: { ${sizeOfDimensions} }`)

    // maps.randomSites = await getRandomSites()
    maps.devices = await getDevices()
    maps.OSes = await getOSes()

    maps.advertisers_products = await advertisersProducts()
    let sizeOfAdvertisersProducts = await memorySizeOf(maps.advertisers_products)
    console.log(` *** size Of sizeOfAdvertisersProducts: { ${sizeOfAdvertisersProducts} }`)


    maps.landing_pages = await lp()
    let sizeOfLP = await memorySizeOf(maps.landing_pages)
    console.log(` *** size Of sizeOfLP: { ${sizeOfLP} }`)

    maps.aff_info = await affInfo()
    let sizeOfAffInfo = await memorySizeOf(maps.aff_info)
    console.log(` *** size Of sizeOfAffInfo: { ${sizeOfAffInfo} }`)


    maps.campaigns = await campaigns()
    let sizeOfCampaigns = await memorySizeOf(maps.campaigns)
    console.log(` *** size Of sizeOfCampaigns: { ${sizeOfCampaigns} }`)

    maps.segments = await segmentsFormat()
    let sizeOfSegmentsFormat = await memorySizeOf(maps.segments)
    console.log(` *** size Of sizeOfSegmentsFormat: { ${sizeOfSegmentsFormat} }`)


    maps.adUnits = await adUnits()
    let sizeOfadUnits = await memorySizeOf(maps.adUnits)
    console.log(` *** size Of sizeOfadUnits: { ${sizeOfadUnits} }`)


    maps.smart_ad = await smartAd()
    let sizeOfSmartAd = await memorySizeOf(maps.smart_ad)
    console.log(` *** size Of sizeOfSmartAd: { ${sizeOfSmartAd} }`)


    maps.creatives = await creatives()
    let sizeOfCreatives = await memorySizeOf(maps.creatives)
    console.log(` *** size Of sizeOfCreatives: { ${sizeOfCreatives} }`)


    maps.c_group = await cGroup()
    let sizeOfcGroup = await memorySizeOf(maps.c_group)
    console.log(` *** size Of sizeOfcGroup: { ${sizeOfcGroup} }`)


    maps.c_group_segment = await cgroupSegment()
    let sizeOfCgroupSegment = await memorySizeOf(maps.c_group_segment)
    console.log(` *** size Of sizeOfCgroupSegment: { ${sizeOfCgroupSegment} }`)


    maps.affiliate_websites = await affiliateWebsites()
    let sizeOfAffiliateWebsites = await memorySizeOf(maps.affiliate_websites)
    console.log(` *** size Of sizeOfAffiliateWebsites: { ${sizeOfAffiliateWebsites} }`)

    // console.log('maps.randomSites keys:',Object.keys(maps.randomSites))
    // console.log('maps.affiliate_websites keys:',Object.keys(maps.affiliate_websites).length)
    recipeData.maps = maps
    let sizeOfMaps = await memorySizeOf(maps)
    console.log(` *** size Of sizeOfMaps: { ${sizeOfMaps} }`)

    console.log('\n')
    console.timeEnd('recipeDbTime')
    return recipeData
}

module.exports = {
    recipeDb,
}