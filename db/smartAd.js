let dbMysql = require('./mysqlAdcenterDb').get()
const {affInfoFormat} = require('../lib/helper')

const smartAd = async () => {

    try {
        let result = await dbMysql.query(` 
            select id,name from smart_ad
        `)
        await dbMysql.end()
        // console.log(`\nget all adUnits count: ${result.length}`)
        return await affInfoFormat(result)
    } catch (e) {
        console.log(e)
    }
}

module.exports = {
    smartAd,
}