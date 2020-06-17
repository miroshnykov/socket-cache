let dbMysql = require('./mysqlAdcenterDb').get()
const {affInfoFormat} = require('../lib/helper')

const affInfo = async () => {

    try {
        let result = await dbMysql.query(` 
            SELECT aff.id                                        AS id, 
                   Concat_ws("", aff.first_name, aff.last_name) AS affiliate_name, 
                   aff.affiliate_type                            AS affiliate_type, 
                   aff.status                                    AS status, 
                   aff.account_mgr_id                            AS account_mger_id, 
                   emple.name                                    AS account_manager, 
                   aff.employee_id                               AS account_executive_id, 
                   empl.name                                     AS account_executive, 
                   aff.is_traffic_blocked                        AS is_traffic_blocked, 
                   aff.is_lock_payment                           AS is_lock_payment 
            FROM   affiliates aff 
                   LEFT JOIN employees emple 
                          ON emple.id = aff.account_mgr_id 
                   LEFT JOIN employees empl 
                          ON empl.id = aff.employee_id 
        `)
        await dbMysql.end()
        // console.log(`\nget all adUnits count: ${result.length}`)
        return await affInfoFormat(result)
    } catch (e) {
        console.log(e)
    }
}

module.exports = {
    affInfo,
}