const express = require('express');
const config = require('plain-config')()
const http = require('http')
const socketIO = require('socket.io')
const app = express()
const server = http.createServer(app);
const io = socketIO(server)
const {getDataCache, setDataCache} = require('./lib/redis')
const {memorySizeOf, formatBytes} = require('./lib/helper')
const {recipeDb} = require('./lib/recipeData')
const metrics = require('./lib/metrics')

app.get('/health', (req, res, next) => {
    res.send('Ok')
})

const LIMIT_CLIENTS = 30
let {hash} = require('./lib/hash')
let clients = []
let sizeof = require('object-sizeof')

io.on('connection', async (socket) => {
    console.log(`\nFlow Rotator instance connected, socket.id:{ ${socket.id} }`);

    let recipeCacheInterval = []
    socket.on('disconnect', () => {
        metrics.setStartMetric({
            route: 'disconnect',
            method: 'GET'
        })
        clearInterval(recipeCacheInterval[socket.id]);
        clients.splice(clients.indexOf(socket.id, 1))
        console.log(`disconnect ${socket.id}, Count of client: ${clients.length} `);
        console.log(`disconnect clients:`, clients);
        metrics.sendMetricsRequest(200)
    })

    socket.on('checkHash', async (hashFr) => {
        // console.log('\n checkHash:', hashFr)
        // return
        let recipeCache = await getDataCache('recipe') || []
        // console.log('recipeCache:',recipeCache)
        if (recipeCache.length === 0) {
            console.log('checkHash recipeCache is NULL')
            return
            metrics.setStartMetric({
                route: 'checkHashEmptyRedis',
                method: 'GET'
            })

            let recipeDataDb = await recipeDb()
            recipeDataDb.hash = hash()
            console.log(`check hash no data in REDIS , get it from DB, new Hash:${recipeDataDb.hash}`)
            await setDataCache('recipe', recipeDataDb)
            io.to(socket.id).emit("recipeCache", recipeDataDb)
            metrics.sendMetricsRequest(200)
            return
        }
        if (recipeCache.hash === hashFr) {
            // console.log(`hash the same, socketId  { ${socket.id} } `)
            return
        }
        console.log(`recipeCacheOrigin:${recipeCache.hash}, FR hash:${hashFr}`)

        console.log(`hash different send to socket id { ${socket.id} }`)
        io.to(socket.id).emit("recipeCache", recipeCache)
        // clients.splice(clients.indexOf(socket.id,1))
        // console.log(`checksum ${data} `);
        // console.log(`disconnect clients:`,clients);
    })

    const sendRecipeCache = async (clients, socketId) => {

        metrics.setStartMetric({
            route: 'recipeCacheChanged',
            method: 'GET'
        })

        // if (runOnce) return
        let recipeCache = await getDataCache('recipe') || []
        let recipeDataDb = await recipeDb()

        // const memoryHeapUsed = process.memoryUsage().heapUsed / (1024 * 1024)
        // const memoryHeapTotal = process.memoryUsage().heapTotal / (1024 * 1024)
        // console.log(`memoryHeapUsed:  \x1b[32m{ ${memoryHeapUsed} }\x1b[0m, memoryHeapTotal: { ${memoryHeapTotal} }`)

        // console.log('DB sizeof maps',formatBytes(sizeof(recipeDataDb.maps)))
        // console.log('DB sizeof maps',formatBytes(sizeof(recipeDataDb.recipe)))
        //
        // console.log(`Cache sizeof maps { ${formatBytes(sizeof(recipeCache.maps))} }`)
        // console.log(`Cache sizeof maps { ${formatBytes(sizeof(recipeCache.recipe))} }`)

        let sizeOfDbMaps = sizeof(recipeDataDb.maps)
        let sizeOfDbRecipe = sizeof(recipeDataDb.recipe)

        let sizeOfCacheMaps = sizeof(recipeCache.maps)
        let sizeOfCacheRecipe = sizeof(recipeCache.recipe)

        // let sizeOfDbMaps = await memorySizeOf(recipeDataDb.maps)
        // let sizeOfDbRecipe = await memorySizeOf(recipeDataDb.recipe)
        //
        //
        // let sizeOfCacheMaps = await memorySizeOf(recipeCache.maps)
        // let sizeOfCacheRecipe = await memorySizeOf(recipeCache.recipe)


        // if (JSON.stringify(recipeDataDb.maps) !== JSON.stringify(recipeCache.maps)) {
        // let recipeCacheIntervalSize = sizeof(recipeCacheInterval)
        // console.log(`*** size Of recipeCacheIntervalSize :     { ${formatBytes(recipeCacheIntervalSize)} }`)

        if (sizeOfCacheMaps !== sizeOfDbMaps
            || sizeOfCacheRecipe !== sizeOfDbRecipe
        ) {

            console.log(`*** size Of DB Maps:     { ${formatBytes(sizeOfDbMaps)} }`)
            console.log(`*** size Of DB Recipe:   { ${formatBytes(sizeOfDbRecipe)} }`)

            console.log(`\n*** size Of Cache Maps:   { ${formatBytes(sizeOfCacheMaps) || 0} }`)
            console.log(`*** size Of Cache Recipe: { ${formatBytes(sizeOfCacheRecipe) || 0} }`)

            // if (JSON.stringify(recipeDataDb.maps) !== JSON.stringify(recipeCache.maps)) {
            console.log(`\nrecipe maps was changed in DB:${JSON.stringify(Object.keys(recipeDataDb.maps))}, send to Flow Rotator`)


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
            console.log(`\nsendRecipeCache socket:${socket.id}`)
            console.log(`Count of clients: ${clients.length}`)
            recipeDataDb.hash = hash()
            console.log(`Hash:${recipeDataDb.hash}`)
            await setDataCache('recipe', recipeDataDb)
            metrics.sendMetricsRequest(200)

            io.sockets.emit("recipeCache", recipeDataDb)

        } else {
            // console.log(`Data in DB does not change, current connected clients: ${clients.length}, time ${currentTime()}`)
        }
    }

    recipeCacheInterval[socket.id] = setInterval(sendRecipeCache, 2000, clients, socket.id)

    if (!clients.includes(socket.id)) {

        metrics.setStartMetric({
            route: 'newClientConnected',
            method: 'GET'
        })

        if (clients.length < LIMIT_CLIENTS) {
            clients.push(socket.id)
            console.log(`Count of clients: ${clients.length} limit ${LIMIT_CLIENTS}`)
            console.log(`New client just connected: ${socket.id} `)
            // return
            let recipeCache = await getDataCache('recipe') || []
            let recipeDbTmp
            if (recipeCache.length === 0) {
                console.log('redis empty dont send data')
                return
                recipeDbTmp = await recipeDb()
                recipeDbTmp.hash = hash()
                await setDataCache('recipe', recipeDbTmp)
            }

            // console.log(`Clients: ${JSON.stringify(clients)} `);
            await waitFor(6000)
            console.log(`Send recipe to new client with hash:{  ${recipeCache.length === 0 && recipeDbTmp.hash || recipeCache.hash} }`)
            // console.log(recipeCache.length === 0 && tmp || recipeCache)
            metrics.sendMetricsRequest(200)
            io.to(socket.id).emit("recipeCache", recipeCache.length === 0 && recipeDbTmp || recipeCache)
        }
    }

})

io.on('connect', async (socket) => {
    console.log(`Connect ${socket.id}, Clients: ${JSON.stringify(clients)} `);
    console.log(`Count of clients: ${clients.length} limit 30`)
})

io.on('disconnect', async (socket) => {
    console.log('  !!!!!!!!!!!!!! disconnect', socket.id)
})

server.listen({port: config.port}, () =>
    console.log(`\n🚀\x1b[35m Server ready at http://localhost:${config.port} \x1b[0m \n`)
)

function scheduleGc() {
    if (!global.gc) {
        console.log('Garbage collection is not exposed');
        return
    }

    setTimeout(function () {
        global.gc();
        const memoryHeapUsed = process.memoryUsage().heapUsed / (1024 * 1024)
        const memoryHeapTotal = process.memoryUsage().heapTotal / (1024 * 1024)
        console.log(`scheduleGc memoryHeapUsed:  \x1b[32m{ ${memoryHeapUsed} }\x1b[0m, memoryHeapTotal: { ${memoryHeapTotal} }`)
        scheduleGc()
    }, 300000) // 5min
}

scheduleGc()

setInterval(function () {
    metrics.sendMetricsSystem()
}, config.influxdb.intervalSystem)

setInterval(function () {
    metrics.sendMetricsDisk()
}, config.influxdb.intervalDisk)

const waitFor = delay => new Promise(resolve => setTimeout(resolve, delay))
