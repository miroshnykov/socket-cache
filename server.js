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

    let response1 = {}
    let segmentsData = await segmentsFormat()
    let lpData = await lpFormat()
    let recipe = lpSegmentMerge(segmentsData,lpData)
    response1.segmentsData = segmentsData
    response1.lpData = lpData
    response1.recip = recipe
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
    socket.on('disconnect', () => {
        // clients.splice(clients.indexOf(socket.id,1))
        console.log(`disconnect ${socket.id}, Count of client: ${clients.length} `);
        // console.log(`disconnect clients:`,clients);
    })

    if (!clients.includes(socket.id)) {

        clients.push(socket.id)
        // let blockedIpData = await blockedIp.getAllBlockedIp()
        let adUnitsCache = await getDataCache('ad-units') || []

        if (adUnitsCache.length === 0) {
            console.log('get from DB adUnits')
            adUnitsCache = await adUnits()
            setDataCache('ad-units', adUnitsCache)

        }

        let citiesCache = await getDataCache('cities') || []
        if (citiesCache.length === 0) {
            console.log('get from DB cities')
            citiesCache = await cities()
            setDataCache('cities', citiesCache)

        }
        // console.log('citiesCache:',citiesCache)
        console.log(`New client just connected: ${socket.id} `);
        io.to(socket.id).emit("adUnits", adUnitsCache)
        io.to(socket.id).emit("cities", citiesCache)
    }
    //
    setInterval(async () => {
        let adUnitsDB = await adUnits()
        let adUnitsCache = await getDataCache('ad-units')

        if (JSON.stringify(adUnitsDB) !== JSON.stringify(adUnitsCache)) {
            console.log(`\nData was changed in DB:${JSON.stringify(adUnitsDB)}, send to Flow Rotator`)
            setDataCache('ad-units', adUnitsDB)
            console.log(`Count of client: ${clients.length},  clients : ${JSON.stringify(clients)}, send to socket.id:${socket.id} \n`)
            io.sockets.emit("adUnits", adUnitsDB);
        }

    }, 60000) //1 min   config.flowRotator.interval
})

server.listen({port: config.port}, () =>
    console.log(`\n🚀\x1b[35m Server ready at http://localhost:${config.port} \x1b[0m \n`)
)

