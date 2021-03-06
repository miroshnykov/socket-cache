let dbMysql = require('./mysqlAdcenterDb').get()
const {adUnitsFormat} = require('../lib/helper')

const creatives = async () => {

    try {
        let result = await dbMysql.query(` 
            select id, name from creatives  WHERE status = 'active'
            limit 10
        `)
        await dbMysql.end()
        // console.log(`\nget all adUnits count: ${result.length}`)
        return await adUnitsFormat(result)
    } catch (e) {
        console.log(e)
    }
}

module.exports = {
    creatives,
}