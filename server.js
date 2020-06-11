const express = require('express');
const config = require('plain-config')()
const http = require('http')
const socketIO = require('socket.io')
const app = express()
const server = http.createServer(app);
const io = socketIO(server)
const {getDataCache, setDataCache} = require('./lib/redis')
const {adUnits} = require('./db/adUnits')
const {cities} = require('./db/cities')
const {lpFormat} = require('./lib/lpFormat')
const {segmentsFormat} = require('./lib/segmentsFormat')
const {lpSegmentMerge} = require('./lib/helper')

app.get('/health', (req, res, next) => {
    res.send('Ok')
})

app.get('/test', async (req, res, next) => {


    let recipeCache = await getDataCache('recipe') || []
    if (recipeCache.length === 0) {
        let segmentsData = await segmentsFormat()
        let lpData = await lpFormat()
        recipeCache = lpSegmentMerge(segmentsData, lpData)
        setDataCache('recipe', recipeCache)
        console.log('set recipe to Cache')
    }
    let response1 = {}
    // response1.segmentsData = segmentsData
    // response1.lpData = lpData
    response1.recipe = recipeCache
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

    socket.on('checksum', (data) => {
        // clients.splice(clients.indexOf(socket.id,1))
        // console.log(`checksum ${data} `);
        // console.log(`disconnect clients:`,clients);
    })
    const sendRecipeCache = async () => {
        console.log('\n sendRecipeCache')
        let recipeCache = await getDataCache('recipe') || []

        let segmentsData = await segmentsFormat()
        let lpData = await lpFormat()
        let recipeDb = lpSegmentMerge(segmentsData, lpData)

        if (JSON.stringify(recipeDb) !== JSON.stringify(recipeCache)) {
            console.log(`\nrecipe was changed in DB:${JSON.stringify(recipeDb)}, send to Flow Rotator`)
            setDataCache('recipe', recipeDb)
            io.sockets.emit("recipeCache", recipeDb)
        }
    }

    recipeCacheInterval[socket.id] = setInterval(sendRecipeCache, 20000);

    if (!clients.includes(socket.id)) {


        if (clients.length < 30) {
            clients.push(socket.id)
            console.log(`Count of clients: ${clients.length} limit 30`)

            let recipeCache = await getDataCache('recipe') || []
            if (recipeCache.length === 0) {
                let segmentsData = await segmentsFormat()
                let lpData = await lpFormat()
                recipeCache = lpSegmentMerge(segmentsData, lpData)
                setDataCache('recipe', recipeCache)
                console.log('set recipe to Cache')
            }
            console.log(`New client just connected: ${socket.id} `);
            console.log(`Clients: ${JSON.stringify(clients)} `);
            await waitFor(2000)
            io.to(socket.id).emit("recipeCache", recipeCache)
        }
    }

})


server.listen({port: config.port}, () =>
    console.log(`\n🚀\x1b[35m Server ready at http://localhost:${config.port} \x1b[0m \n`)
)


const waitFor = delay => new Promise(resolve => setTimeout(resolve, delay))
