const express = require('express');
const config = require('plain-config')()
const http = require('http')
const socketIO = require('socket.io')
const app = express()
const server = http.createServer(app);
const io = socketIO(server)
const {getDataCache, setDataCache} = require('./lib/redis')
const {adUnits} = require('./db/adUnits')
const {memorySizeOf} = require('./lib/helper')
const {recipeDb} = require('./lib/recipeData')

app.get('/health', (req, res, next) => {
    res.send('Ok')
})

app.get('/test', async (req, res, next) => {

    const {advertisersProducts} = require('./db/advertisersProducts')


    // let recipeCache = await getDataCache('recipe') || []
    // if (recipeCache.length === 0) {
    //     let segmentsData = await segmentsFormat()
    //     let lpData = await lpFormat()
    //     recipeCache = lpSegmentMerge(segmentsData, lpData)
    //     setDataCache('recipe', recipeCache)
    //     console.log('set recipe to Cache')
    // }
    let response1 = {}
    let rs = await advertisersProducts()
    console.log(rs)
    response1.advertisersProducts = rs
    // response1.segmentsData = segmentsData
    // response1.lpData = lpData
    res.send(response1)
    return

    console.time('ad-units')
    let response = {}
    // let adUnitsCache = await getDataCache('ad-units')
    // // console.log('adUnitsCache:',adUnitsCache)
    // if (!adUnitsCache){
    //     let adUnits_ = await adUnits()
    //     // console.log('set adUnits_ to redis ')
    //     setDataCache('ad-units',adUnits_)
    //     console.log('get Form db ')
    //     response.count = adUnits_.length
    //     response.source = 'from DB'
    //     console.timeEnd('ad-units')
    //     res.send(response)
    //     return
    // }
    //
    // console.log('get Form redis ', adUnitsCache.length)
    // response.source = 'from cache'
    // response.count = adUnitsCache.length
    // console.timeEnd('ad-units')


    let adUnitsDB = await adUnits()
    let adUnitsCache = await getDataCache('ad-units')

    if (JSON.stringify(adUnitsDB) !== JSON.stringify(adUnitsCache)) {
        console.log('DATA was changed send to FR { adUnits} ')
        setDataCache('ad-units', adUnitsDB)
        response.count = adUnitsDB.length
        response.source = 'setDataCache'
        console.timeEnd('ad-units')
        res.send(response)
        return
    }
    response.source = 'No changes '
    res.send(response)
})

const LIMIT_CLIENTS = 30
const {currentTime} = require('./lib/helper')
let {hash} = require('./lib/hash')
let clients = []

io.on('connection', async (socket) => {
    console.log(`\nFlow Rotator instance connected, socket.id:{ ${socket.id} }`);

    let recipeCacheInterval = []
    socket.on('disconnect', () => {
        clearInterval(recipeCacheInterval[socket.id]);
        clients.splice(clients.indexOf(socket.id, 1))
        console.log(`disconnect ${socket.id}, Count of client: ${clients.length} `);
        console.log(`disconnect clients:`, clients);
    })

    socket.on('checkHash', async (hashFr) => {
        console.log('\n checkHash:', hashFr)
        let recipeCache = await getDataCache('recipe') || []
        console.log('recipeCacheOrigin', recipeCache.hash)
        if (recipeCache.hash === hashFr) {
            console.log(`hash the same, socketId  { ${socket.id} } `)
            return
        }
        console.log(`hash different send to socket id { ${socket.id} }`)
        io.to(socket.id).emit("recipeCache", recipeCache)
        // clients.splice(clients.indexOf(socket.id,1))
        // console.log(`checksum ${data} `);
        // console.log(`disconnect clients:`,clients);
    })

    const sendRecipeCache = async (clients, socketId) => {

        let recipeCache = await getDataCache('recipe') || []
        let recipeDataDb = await recipeDb()
        let sizeOfrecipeDataDb = await memorySizeOf(recipeDataDb)
        let sizeOfclients = await memorySizeOf(clients)
        let sizeOfrecipeCache = await memorySizeOf(recipeCache)
        console.log(` *** size Of recipeDataDb: { ${sizeOfrecipeDataDb} }`)
        console.log(` *** size Of recipeCache: { ${sizeOfrecipeCache} }`)
        console.log(` *** size Of clients: { ${sizeOfclients} }`)
        console.log(' *** socketId', socketId)
        if (JSON.stringify(recipeDataDb.recipe) !== JSON.stringify(recipeCache.recipe) ||
            JSON.stringify(recipeDataDb.maps) !== JSON.stringify(recipeCache.maps)
        ) {
            console.log(`\nrecipe maps was changed in DB:${JSON.stringify(Object.keys(recipeDataDb.maps))}, send to Flow Rotator`)
            // console.log(`\nrecipe was changed in DB:${JSON.stringify(Object.entries(recipeDataDb.recipe).length)}, send to Flow Rotator`)
            console.log(`\nsendRecipeCache socket:${socket.id}`)
            console.log(`Count of clients: ${clients.length}`)

            recipeDataDb.hash = hash()
            setDataCache('recipe', recipeDataDb)

            io.sockets.emit("recipeCache", recipeDataDb)
        } else {
            console.log(`Data in DB does not change, current connected clients: ${clients.length}, time ${currentTime()}`)
        }
    }

    recipeCacheInterval[socket.id] = setInterval(sendRecipeCache, 20000, clients, socket.id)

    if (!clients.includes(socket.id)) {


        if (clients.length < LIMIT_CLIENTS) {
            clients.push(socket.id)
            console.log(`Count of clients: ${clients.length} limit ${LIMIT_CLIENTS}`)

            return
            let recipeCache = await getDataCache('recipe') || []
            let recipeDbTmp
            if (recipeCache.length === 0) {
                recipeDbTmp = await recipeDb()
                recipeDbTmp.hash = hash()
                setDataCache('recipe', recipeDbTmp)
                console.log(`set recipe to Cache hash:${recipeDbTmp.hash}`)
            }
            console.log(`New client just connected: ${socket.id} `);
            console.log(`Clients: ${JSON.stringify(clients)} `);
            await waitFor(2000)
            // console.log(recipeCache.length === 0 && tmp || recipeCache)
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

setInterval(() => {
    console.log('\n')

}, 19000)


const waitFor = delay => new Promise(resolve => setTimeout(resolve, delay))
