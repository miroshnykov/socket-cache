let config = {};

config.port = 8091

config.mysql = {
    host: '',
    user: '',
    password: '',
    database: ''
}

config.redis = {
    host: '',
    port: 6379
}

config.flowRotator = {
    interval: 1000 * 60 * 15
}

module.exports = config;