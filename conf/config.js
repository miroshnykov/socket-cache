let config = {};

config.port = 8091

config.env = process.env.NODE_ENV || `production`

config.db = {
    adcenter: {
        host: '',
        user: '',
        port: 3306,
        password: '',
        database: ''
    },
    maxmind: {
        database: ''
    }
}

config.api = {
    randomsites: {
        host: 'http://admin-wt.jomediainc.com',
        path: '/api/getRandomSites.php'
    },
    devices: {
        host: 'http://admin.ad-center.com',
        path: '/api/getDeviceGroups.php'
    },
    OSes: {
        host: 'http://admin.ad-center.com',
        path: '/api/getOsGroups.php'
    }
}

config.segment = {
    location: {
        country: 1,
        region: 2,
        city: 3
    },
    dimension: {
        geo: 'geo',
        pixel: 'pixel'
    }
}

config.landingPage = {
    weighting: {
        scale: 10000
    },
    target: 'signup'
}

config.redis = {
    host: '',
    port: 6379
}

config.flowRotator = {
    interval: 1000 * 60 * 15
}

config.influxdb = {
    host: 'https://influx.surge.systems/influxdb',
    project: 'traffic-cache',
    intervalRequest: 10, // batch post to influxdb when queue length gte 100
    intervalSystem: 30000, // 30000 ms = 30 s
    intervalDisk: 60000 // 300000 ms = 5 min
}

module.exports = config;