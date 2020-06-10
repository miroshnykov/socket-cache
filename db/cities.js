let dbMysql = require('./mysqlMaxmindDb').get()

const cities = async () => {

    try {
        let result = await dbMysql.query(` 
            SELECT c.id, 
                   c.region, 
                   c.country, 
                   c.continent, 
                   c.name, 
                   c.lat, 
                   c.lng, 
                   c.hits 
            FROM   city c 
        `)
        await dbMysql.end()

        console.log(`\nget all cities count: ${result.length}`)
        return result
    } catch (e) {
        console.log(e)
    }
}

module.exports = {
    cities,
}