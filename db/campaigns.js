let dbMysql = require('./mysqlAdcenterDb').get()
const {campaignsFormat} = require('../lib/helper')

const campaigns = async () => {

    try {
        let result = await dbMysql.query(` 
            SELECT id, name FROM campaigns where status = 'active'
        `)
        await dbMysql.end()
        // console.log(`\nget all adUnits count: ${result.length}`)
        return await campaignsFormat(result)
    } catch (e) {
        console.log(e)
    }
}

module.exports = {
    campaigns,
}