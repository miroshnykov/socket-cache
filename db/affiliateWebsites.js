let dbMysql = require('./mysqlAdcenterDb').get()
const {affiliateWebsitesFormat} = require('../lib/helper')

const affiliateWebsites = async () => {

    try {
        let result = await dbMysql.query(` 
            SELECT id, 
                   link, 
                   status, 
                   affiliate_id 
            FROM   affiliate_websites 
            WHERE  status IN ( 'active', 'pending' )
        `)
        await dbMysql.end()
        // console.log(`\nget all adUnits count: ${result.length}`)
        return await affiliateWebsitesFormat(result)
    } catch (e) {
        console.log(e)
    }
}

module.exports = {
    affiliateWebsites,
}