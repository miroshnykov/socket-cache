let dbMysql = require('./mysqlAdcenterDb').get()
const {affiliateWebsitesFormat} = require('../lib/helper')

const affiliateWebsites = async () => {

    try {
        let result = await dbMysql.query(` 
            SELECT w.id AS id, 
                   w.link AS link, 
                   w.status AS status, 
                   w.affiliate_id AS affiliate_id
            FROM   affiliate_websites w, 
                   affiliates a 
            WHERE  a.id = w.affiliate_id 
                   AND w.status IN ( 'active', 'pending' ) 
                   AND a.status = 'active' 
                   AND a.salesforce_id <> 0                   
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