let dbMysql = require('./mysqlAdcenterDb').get()
const {adUnitsFormat} = require('../lib/helper')

const adUnits = async () => {

    try {
        let result = await dbMysql.query(` 
            select id,name from ad_units  WHERE status = 'active'
        `)
        await dbMysql.end()
        // console.log(`\nget all adUnits count: ${result.length}`)
        return await adUnitsFormat(result)
    } catch (e) {
        console.log(e)
    }
}

module.exports = {
    adUnits,
}