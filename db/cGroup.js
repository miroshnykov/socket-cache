let dbMysql = require('./mysqlAdcenterDb').get()
const {adUnitsFormat} = require('../lib/helper')

const cGroup = async () => {

    try {
        let result = await dbMysql.query(` 
            select id,name from c_group
        `)
        await dbMysql.end()
        // console.log(`\nget all adUnits count: ${result.length}`)
        return await adUnitsFormat(result)
    } catch (e) {
        console.log(e)
    }
}

module.exports = {
    cGroup,
}