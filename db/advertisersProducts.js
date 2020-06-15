let dbMysql = require('./mysqlAdcenterDb').get()
const {advertisersProductsFormat} = require('../lib/helper')

const advertisersProducts = async () => {

    try {
        let result = await dbMysql.query(` 
            SELECT acp.id            AS advertiser_product_id, 
                   acp.name          AS advertiser_product_name, 
                   acp.advertiser_id AS advertiser_id, 
                   advs.name         AS advertiser_name, 
                   acp.program_id    AS advertiser_program_id, 
                   pgm.name          AS program_name, 
                   forward_offer_parameters, 
                   tracking_code 
            FROM   ac_products AS acp 
                   INNER JOIN advertisers AS advs 
                           ON acp.advertiser_id = advs.id 
                   LEFT JOIN programs pgm 
                          ON pgm.id = acp.program_id 
            WHERE  acp.status = 'active'

        `)
        await dbMysql.end()
        // console.log(`\nget all adUnits count: ${result.length}`)
        return await advertisersProductsFormat(result)
    } catch (e) {
        console.log(e)
    }
}

module.exports = {
    advertisersProducts,
}