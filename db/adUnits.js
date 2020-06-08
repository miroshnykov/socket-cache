let dbMysql = require('./mysqlDb').get()

const adUnits = async () => {

    try {
        let result = await dbMysql.query(` 
            select id,name from ad_units
        `)
        await dbMysql.end()

        console.log(`\nget all adUnits count: ${result.length}`)
        return result
    } catch (e) {
        console.log(e)
    }
}

module.exports = {
    adUnits,
}