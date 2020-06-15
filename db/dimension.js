let dbMysql = require('./mysqlAdcenterDb').get()
const {dimensionsFormat} = require('../lib/helper')

const dimension = async () => {

    try {
        let result = await dbMysql.query(` 
            SELECT id, name FROM v_dimension
        `)
        await dbMysql.end()
        // console.log(`\nget all dimension count: ${result.length}`)
        return await dimensionsFormat(result)
    } catch (e) {
        console.log(e)
    }
}

module.exports = {
    dimension,
}