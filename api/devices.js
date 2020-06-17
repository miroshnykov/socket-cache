const config = require('plain-config')()
const axios = require('axios')
const {catchHandler} = require('../lib/catchErr')
const {devicesFormat} = require('../lib/helper')

const devicesReq = axios.create({
    baseURL: config.api.devices.host
})

const getDevices = async () => {

    try {
        // let {data} = await devicesReq.get(config.api.devices.path)
        let data = getManualDevices()
        return await devicesFormat(data)

    } catch (e) {
        catchHandler(e, 'getDevices')
    }
}

const getManualDevices = () => {
    return {
        "samsung sgh-i747m": 21,
        "ipad": 27,
        "ipad2,1": 27,
        "ipad1,1": 27,
        "ipad2,2": 27,
        "ipad2,3": 27,
        "ipad2,4": 27,
        "ipad2,5": 27,
        "ipad2,6": 27,
        "ipad2,7": 27,
        "ipad3,1": 27,
        "ipad3,2": 27,
        "ipad3,3": 27,
        "ipad3,4": 27,
        "ipad3,5": 27,
        "ipad3,6": 27,
        "ipad4,1": 27,
        "ipad4,2": 27,
        "ipad4,4": 27,
        "ipad4,5": 27,
        "ipad4,7": 27,
        "ipad4,8": 27,
        "ipad5,1": 27,
        "ipad5,3": 27,
        "ipad5,4": 27,
        "xbox xbox one": 29,
        "xbox": 29,
        "xbox-lcdgameengine": 29,
        "nintendo wii": 29,
        "nintendo wii u": 29,
        "playstation 3": 29,
        "playstation 4": 29,
        "playstation vita": 29,
        "playstation portable": 29,
        "nintendo 3ds": 29,
        "nintendo ds": 29,
        "amazon kindle fire;": 31,
        "amazon_kindle_fire": 31,
        "kindle": 31,
        "kindle fire": 31,
        "kindle fire 1": 31,
        "kindle fire 2": 31,
        "kindle fire hd": 31,
        "kindle fire hd (3rd generation)": 31,
        "kindle fire hd 7": 31,
        "kindle fire hd 7\" wifi": 31,
        "kindle fire hd 8.9\" 4g": 31,
        "kindle fire hd 8.9\" wifi": 31,
        "kindle fire hd lte": 31,
        "kindle fire hdx": 31,
        "kindle fire hdx 7": 31,
        "kindle fire hdx 7\" 4g": 31,
        "kindle fire hdx 7\" wifi": 31,
        "kindle fire hdx 8.9": 31,
        "kindle fire hdx 8.9\" 4g": 31,
        "kindle fire hdx 8.9\" wifi": 31,
        "kindle fire2": 31,
        "kindle_fire": 31,
        "neo-x5": 33,
        "neo-x5-116a": 33,
        "neo-x5-116i": 33,
        "neo-x5-mini": 33,
        "neo-x6": 33,
        "neo-x7": 33,
        "neo-x7-216a": 33,
        "neo-x7-216a (android2tv series)": 33,
        "neo-x7-216a;": 33,
        "neo-x7-i": 33,
        "neo-x7-mini": 33,
        "neo-x7-mini (android2tv series)": 33,
        "neo-x8": 33,
        "neo-x8-h": 33,
        "neo-x8-plus": 33,
        "neo-x8-plus;": 33,
        "neo-x88i": 33,
        "neo-x8h": 33,
        "neo-x8h-plus": 33,
        "neo-x9": 33,
        "aftb": 33,
        "aftb ro.product.brand=qcom": 33,
        "aftb;": 33,
        "samsung aftb": 33,
        "appletv": 33,
        "airtv player": 33,
        "dish airtv player": 33,
        "9 music player": 33,
        "android player": 33,
        "cyclone android x4+ 64 bit bluetooth media player": 33,
        "cyclone android x4+ 64 bit bluetooth media player;": 33,
        "eduplayer": 33,
        "freebox player mini": 33,
        "freebox player mini v2": 33,
        "hdc galaxy player n7300 ex": 33,
        "htc streaming player htc": 33,
        "htc streaming player kddi": 33,
        "i3huddle player": 33,
        "lg player": 33,
        "mediaplayer": 33,
        "mediaplayer x9": 33,
        "mediaplayer x9 v2": 33,
        "motorola droidplayer m8n": 33,
        "motorola droidplayer m8n 1.4": 33,
        "motorola droidplayer m8n 1.5": 33,
        "motorola droidplayer m8n 1.6": 33,
        "motorola droidplayer m8n 1.8": 33,
        "motorola droidplayer m8n 1.9.1": 33,
        "motorola droidplayer m8n 2.0.1": 33,
        "motorola droidplayer m8n 2.4.2": 33,
        "motorola droidplayer m8n 2.4.3": 33,
        "motorola droidplayer m8n 2.4.5": 33,
        "motorola droidplayer m8n 2.4.6": 33,
        "motorola droidplayer m8n 2.4.7": 33,
        "motorola droidplayer mx2": 33,
        "motorola droidplayer mx2 1.5": 33,
        "motorola droidplayer mx2 1.6": 33,
        "motorola droidplayer mx2 1.7": 33,
        "motorola droidplayer mx2 1.8.1": 33,
        "motorola droidplayer mx2 1.8.2": 33,
        "motorola droidplayer mx2 1.8.3": 33,
        "motorola droidplayer mx2 1.8.5": 33,
        "motorola droidplayer mxq 1.5": 33,
        "motorola droidplayer mxq 1.8.0": 33,
        "motorola droidplayer mxq 1.8.1": 33,
        "motorola droidplayer mxq 1.8.2": 33,
        "motorola droidplayer mxq 1.8.3": 33,
        "motorola droidplayer mxq 1.8.4": 33,
        "motorola droidplayer mxq 1.8.5": 33,
        "motorola droidplayer mxq 1.8.6": 33,
        "motorola droidplayer mxq 1.8.7": 33,
        "motorola droidplayer mxq 1.8.8": 33,
        "motorola droidplayer mxq 1.8.8-ota": 33,
        "motorola droidplayer mxq 1.9.0 base": 33,
        "motorola droidplayer x200": 33,
        "motox player xt_1563": 33,
        "nexus player": 33,
        "ops-drd digital signage player": 33,
        "player": 33,
        "proworx c13 mini media player": 33,
        "remix os player": 33,
        "samsung freebox player mini v2": 33,
        "tablet player": 33,
        "union y538 media player": 33,
        "wiwa dream player tv": 33,
        "wodplayer4k": 33,
        "xplayer": 33,
        "yiwanplayer": 33,
        "iphone4,1": 26,
        "iphone 5c": 26,
        "iphone 6": 26,
        "iphone4,5": 26,
        "iphone5,1": 26,
        "iphone5,2": 26,
        "iphone5,3": 26,
        "iphone5,4": 26,
        "iphone5c": 26,
        "iphone5s": 26,
        "iphone6,1": 26,
        "iphone6,2": 26,
        "iphone7,1": 26,
        "iphone7,2": 26,
        "iphone_5s": 26,
        "iphone": 26,
        "iphone2,1": 26,
        "iphone2,5": 26,
        "iphone3,1": 26,
        "iphone3,2": 26,
        "iphone3,3": 26,
        "iphone3,4": 26,
        "iphone 6s+": 26,
        "iphone 6se": 26,
        "iphone 6splus": 26,
        "iphone 6x": 26,
        "iphone 7": 26,
        "iphone 7 \" rezky punya \"": 26,
        "iphone 7 plus": 26,
        "iphone 7 s": 26,
        "iphone 7+": 26,
        "iphone 7-d325": 26,
        "iphone 7plus": 26,
        "iphone 7plus x**": 26,
        "???????iphone  6s": 26,
        "aple iphone s6": 26,
        "apple iphone 4_android version": 26,
        "apple iphone 5s": 26,
        "apple iphone 6": 26,
        "apple iphone 6 plus": 26,
        "apple iphone 6+": 26,
        "apple iphone 6s": 26,
        "apple iphone 7": 26,
        "apple iphone 7 plus": 26,
        "apple iphone 7+": 26,
        "apple-iphone 6s": 26,
        "huawei caiphone x9+": 26,
        "iphone   6 piue": 26,
        "iphone  5s": 26,
        "iphone 10": 26,
        "iphone 100": 26,
        "iphone 1000": 26,
        "iphone 10plus": 26,
        "iphone 11s": 26,
        "iphone 2000000000000": 26,
        "iphone 3310": 26,
        "iphone 39 plus": 26,
        "iphone 4": 26,
        "iphone 4s": 26,
        "iphone 4s by noeh latifatul mustifah": 26,
        "iphone 4s dual core": 26,
        "iphone 5": 26,
        "iphone 5s": 26,
        "iphone 5s+": 26,
        "iphone 6 plus ": 26,
        "iphone 6 s": 26,
        "iphone 6+": 26,
        "iphone 6+plus": 26,
        "iphone 6plus": 26,
        "iphone 6s": 26,
        "iphone 6s (hdc)": 26,
        "iphone 6s plus": 26,
        "iphone 6s plus a1634": 26,
        "iphone 6s plus?????": 26,
        "iphone 6s special edition": 26,
        "iphone 7s": 26,
        "iphone 7s plus": 26,
        "iphone 7s pro ????????????????": 26,
        "iphone 8": 26,
        "iphone 8$": 26,
        "iphone 8s": 26,
        "iphone 9": 26,
        "iphone android 10 s plus": 26,
        "iphone android edition": 26,
        "iphone by aryan": 26,
        "iphone c600": 26,
        "iphone funker s555": 26,
        "iphone galaxy edge": 26,
        "iphone ios 7": 26,
        "iphone ipad": 26,
        "iphone iphone5c": 26,
        "iphone iphone5s": 26,
        "iphone jes\u00fas mayta": 26,
        "iphone my35": 26,
        "iphone operating system (ios)": 26,
        "iphone positivo": 26,
        "iphone s6": 26,
        "iphone s7+": 26,
        "iphone sqdaemon": 26,
        "iphone x": 26,
        "iphone y wea": 26,
        "iphone z1": 26,
        "joy iphone 7": 26,
        "mz-iphone 7": 26,
        "mz-iphone x": 26,
        "samsung iphone 5": 26,
        "samsung iphone 6s": 26,
        "samsung sm-iphone s6": 26,
        "techniphone 5": 26
    }

}
module.exports = {
    getDevices
}