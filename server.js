const express = require('express');
const config = require('plain-config')()
const http = require('http')
const socketIO = require('socket.io')
const app = express()
const server = http.createServer(app);
const io = socketIO(server)
const {getDataCache, setDataCache} = require('./lib/redis')
const {memorySizeOf} = require('./lib/helper')
const {recipeDb} = require('./lib/recipeData')
const {checksum} = require('./db/checksum')
const metrics = require('./lib/metrics')

const {currentTime} = require('./lib/helper')
const os = require('os')

app.get('/health', (req, res, next) => {
    res.send('Ok')
})

app.get('/test', async (req, res, next) => {
    console.time('recipeDb')
    // let recipeDataDb = await recipeDb()
    for (let i = 0; i < 80; i++) {
        let recipeDataDb1 = await recipeDb()
    }
    console.timeEnd('recipeDb')
    const {rss, heapUsed, heapTotal} = process.memoryUsage()
    console.log(`rss: { ${numeral(rss).format('0.0 ib')} }, heapUsed: { ${numeral(heapUsed).format('0.0 ib')} }, heapTotal: { ${numeral(heapTotal).format('0.0 ib')} }`)

    res.send('done')
})


const LIMIT_CLIENTS = 30
let {hash} = require('./lib/hash')
let clients = []


io.on('connection', async (socket) => {
    console.log(`\nFlow Rotator instance connected, socket.id:{ ${socket.id} }`);

    socket.on('disconnect', () => {
        clients.splice(clients.indexOf(socket.id, 1))
        console.log(`disconnect ${socket.id}, Count of client: ${clients.length} `);
        console.log(`disconnect clients:`, clients);
        metrics.influxdb(200, `disconnect`)
    })

    socket.on('checkHash', async (hashFr) => {
        try {
            let recipeCache = await getDataCache('recipe') || []
            if (recipeCache.length === 0) {
                console.log('checkHash recipeCache is NULL')
                return
            }
            if (recipeCache.hash === hashFr) {
                // console.log(`hash the same, socketId  { ${socket.id} } `)
                return
            }

            console.log(`Hash is different, send to socket id { ${socket.id} }, Count of client: ${clients.length}, recipeCacheOrigin:{ ${recipeCache.hash} }, FR hash:{ ${hashFr} }`)
            io.to(socket.id).emit("recipeCache", recipeCache)

            metrics.influxdb(200, `differentHash`)
        } catch (e) {
            metrics.influxdb(500, `differentHashError`)
        }

    })

    if (!clients.includes(socket.id)) {

        await waitFor(6000)

        if (clients.length < LIMIT_CLIENTS) {
            clients.push(socket.id)
            console.log(`Count of clients: ${clients.length} limit ${LIMIT_CLIENTS}`)
            console.log(`New client just connected: ${socket.id} `)
            metrics.influxdb(200, `clientsCount-${clients.length}`)
            // return
            let recipeCache = await getDataCache('recipe') || []
            if (recipeCache.length === 0) {
                console.log('redis empty dont send data')
                return
            }

            console.log(`Send recipe to new client with hash:{ ${recipeCache.hash} }`)
            metrics.influxdb(200, `newClientSentRecipe`)
            io.to(socket.id).emit("recipeCache", recipeCache)
        }
    }

})

io.on('connect', async (socket) => {
    console.log(`Connect ${socket.id}, Clients: ${JSON.stringify(clients)} `);
    console.log(`Count of clients: ${clients.length} limit 30`)
    metrics.influxdb(200, `clientsCount-${clients.length}`)
})

server.listen({port: config.port}, () => {
    metrics.influxdb(200, `serveReady`)
    console.log(`\n🚀\x1b[35m Server ready at http://localhost:${config.port} \x1b[0m \n`)
})


const numeral = require('numeral')

function scheduleGc() {
    if (!global.gc) {
        console.log('Garbage collection is not exposed');
        return
    }

    setTimeout(() => {

        const memoryHeapUsed = process.memoryUsage().heapUsed
        const memoryHeapTotal = process.memoryUsage().heapTotal
        const memoryRss = process.memoryUsage().rss
        console.log(`Before Garbage collection running, rss: { ${numeral(memoryRss).format('0.0 ib')} }, heapUsed  { ${numeral(memoryHeapUsed).format('0.0 ib')} }, heapTotal: { ${numeral(memoryHeapTotal).format('0.0 ib')} }`)

        global.gc();

        const {rss, heapUsed, heapTotal} = process.memoryUsage()
        console.log(`*After Garbage collection running, rss: { ${numeral(rss).format('0.0 ib')} }, heapUsed: { ${numeral(heapUsed).format('0.0 ib')} }, heapTotal: { ${numeral(heapTotal).format('0.0 ib')} }`)

        let totalmem = os.totalmem()
        let freemem = os.freemem()
        let memory_usage_perc = Number((100 - (freemem / totalmem) * 100).toFixed(2))

        console.log(`Memory usage: { ${memory_usage_perc} }`)


        scheduleGc()
    }, 300000) // 5min
}

// scheduleGc()


setInterval(() => {
    if (config.env === 'development') return
    metrics.sendMetricsSystem()
}, config.influxdb.intervalSystem)

setInterval(() => {
    if (config.env === 'development') return
    metrics.sendMetricsDisk()
}, config.influxdb.intervalDisk)

const recipeUpdateOld = async () => {


    try {
        let recipeCache = await getDataCache('recipe') || []
        let recipeDataDb = await recipeDb()

        let sizeOfDbMaps = await memorySizeOf(recipeDataDb.maps)
        let sizeOfDbRecipe = await memorySizeOf(recipeDataDb.recipe)


        let sizeOfCacheMaps = await memorySizeOf(recipeCache.maps)
        let sizeOfCacheRecipe = await memorySizeOf(recipeCache.recipe)

        // if (JSON.stringify(recipeDataDb.maps) !== JSON.stringify(recipeCache.maps)) {
        if (sizeOfCacheMaps !== sizeOfDbMaps
            || sizeOfCacheRecipe !== sizeOfDbRecipe
        ) {

            metrics.influxdb(200, `sizeOfDbMaps-${sizeOfDbMaps}`)
            metrics.influxdb(200, `sizeOfDbRecipe-${sizeOfDbRecipe}`)

            console.log(`*** size Of DB Maps:   { ${sizeOfDbMaps || 0} }, Recipe{ ${sizeOfDbRecipe || 0} }`)

            console.log(`*** size Of Cache Maps:{ ${sizeOfCacheMaps || 0} }, Recipe:{ ${sizeOfCacheRecipe || 0} }`)

            // if (JSON.stringify(recipeDataDb.maps) !== JSON.stringify(recipeCache.maps)) {
            // console.log(`\nrecipe maps was changed in DB:${JSON.stringify(Object.keys(recipeDataDb.maps))}, send to Flow Rotator`)


            // console.log(`  Count:
            //         landing_pages:{ ${recipeDataDb.maps.landing_pages.length} }
            //         affiliate_websites:{ ${Object.keys(recipeDataDb.maps.affiliate_websites).length} }
            //         c_group_segment:{ ${Object.keys(recipeDataDb.maps.c_group_segment).length} }
            //         c_group:{ ${Object.keys(recipeDataDb.maps.c_group).length} }
            //         adUnits:{ ${Object.keys(recipeDataDb.maps.adUnits).length} }
            //         segments:{ ${Object.keys(recipeDataDb.maps.segments).length} }
            //         aff_info:{ ${Object.keys(recipeDataDb.maps.aff_info).length} }
            //         campaigns:{ ${Object.keys(recipeDataDb.maps.campaigns).length} }
            //         dimensions:{ ${Object.keys(recipeDataDb.maps.dimensions).length} }
            //         smart_ad:{ ${Object.keys(recipeDataDb.maps.smart_ad).length} }
            //         recipeDb:{ ${recipeDataDb.recipe.length} }`
            // )
            // console.log(`\nrecipe was changed in DB:${JSON.stringify(Object.entries(recipeDataDb.recipe).length)}, send to Flow Rotator`)
            recipeDataDb.hash = hash()
            // console.log(`Hash:${recipeDataDb.hash}`)
            await setDataCache('recipe', recipeDataDb)
            metrics.influxdb(200, `recipeCacheChanged`)

        } else {
            // console.log(`Data in DB does not change,  time ${currentTime()}`)
        }
    } catch (e) {
        metrics.influxdb(500, `recipeCacheChangedError`)
    }


}

const recipeUpdate = async () => {

    let recipeDataDb = await recipeDb()

    let sizeOfDbMaps = await memorySizeOf(recipeDataDb.maps)
    let sizeOfDbRecipe = await memorySizeOf(recipeDataDb.recipe)

    console.log(`*** size Of DB Maps:     { ${sizeOfDbMaps} }`)
    console.log(`*** size Of DB Recipe:   { ${sizeOfDbRecipe} }`)


    console.log(`  Count: 
                landing_pages:{ ${recipeDataDb.maps.landing_pages.length} }
                affiliate_websites:{ ${Object.keys(recipeDataDb.maps.affiliate_websites).length} }
                c_group_segment:{ ${Object.keys(recipeDataDb.maps.c_group_segment).length} }
                c_group:{ ${Object.keys(recipeDataDb.maps.c_group).length} }
                adUnits:{ ${Object.keys(recipeDataDb.maps.adUnits).length} }
                segments:{ ${Object.keys(recipeDataDb.maps.segments).length} }
                aff_info:{ ${Object.keys(recipeDataDb.maps.aff_info).length} }
                campaigns:{ ${Object.keys(recipeDataDb.maps.campaigns).length} }
                dimensions:{ ${Object.keys(recipeDataDb.maps.dimensions).length} }
                smart_ad:{ ${Object.keys(recipeDataDb.maps.smart_ad).length} }
                recipeDb:{ ${recipeDataDb.recipe.length} }`
    )
    // console.log(`\nrecipe was changed in DB:${JSON.stringify(Object.entries(recipeDataDb.recipe).length)}, send to Flow Rotator`)
    recipeDataDb.hash = hash()
    console.log(`Hash:${recipeDataDb.hash}`)
    await setDataCache('recipe', recipeDataDb)
    metrics.influxdb(200, `recipeCacheChanged`)


    let totalmem = os.totalmem()
    let freemem = os.freemem()
    let memory_usage_perc = Number((100 - (freemem / totalmem) * 100).toFixed(2))

    console.log(`Memory usage: { ${memory_usage_perc} }`)

    const {rss, heapUsed, heapTotal} = process.memoryUsage()
    console.log(`* Memory rss: { ${numeral(rss).format('0.0 ib')} }, heapUsed: { ${numeral(heapUsed).format('0.0 ib')} }, heapTotal: { ${numeral(heapTotal).format('0.0 ib')} }`)


}

setInterval(async () => {
    await recipeUpdateOld()

    // let checksumDb = await checksum()
    // let checksumDbRedis = await getDataCache('checksum') || []
    // if (checksumDb !== checksumDbRedis) {
    //     console.log(`checksum is different, let update recipe in redis, checksumDb:{ ${checksumDb} } ,checksumDbRedis: { ${checksumDbRedis} }`)
    //     await setDataCache('checksum', checksumDb)
    //     await recipeUpdate()
    // }
    //
    // checksumDbRedis = null
    // checksumDb = null
}, 60000) // 1 min

// run once, first setup to redis from DB
setTimeout(async () => {


    try {
        let recipeCache = await getDataCache('recipe') || []
        console.log('Redis count:', Object.keys(recipeCache).length)
        if (Object.keys(recipeCache).length === 0) {

            let recipeDataDb = await recipeDb()
            recipeDataDb.hash = hash()
            console.log(`Redis is empty, set from DB with hash: { ${recipeDataDb.hash} }`)
            await setDataCache('recipe', recipeDataDb)
        }

        metrics.influxdb(200, `firstSetRedisLocal`)
    } catch (e) {
        metrics.influxdb(500, `firstSetRedisLocalError`)
    }

    // recipeCache = null
}, 3000)

const waitFor = delay => new Promise(resolve => setTimeout(resolve, delay))
