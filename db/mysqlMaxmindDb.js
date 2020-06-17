const mysql = require('serverless-mysql')()
let mysqlAdcenterDb
const config = require('plain-config')()
module.exports = {

    get: () => {
        if (!mysqlAdcenterDb) {
            console.log(`\n \x1b[35m First init adcenter DB \x1b[0m`)
            console.log(config.db.maxmind)
            const {host, user, password, port} = config.db.adcenter
            const {database} = config.db.maxmind
            let mysqlConfig = {
                host: host,
                database: database,
                user: user,
                password: password,
                port: port
            }
            mysql.config(mysqlConfig)
            mysqlAdcenterDb = mysql
        }
        // console.log(' << get singleton DB >>')
        return mysqlAdcenterDb
    }
}
