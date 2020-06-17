const config = require('plain-config')()
const axios = require('axios')
const {catchHandler} = require('../lib/catchErr')
const {devicesFormat} = require('../lib/helper')

const oSesReq = axios.create({
    baseURL: config.api.OSes.host
})

const getOSes = async () => {

    try {
        // let {data} = await oSesReq.get(config.api.OSes.path)
        let data = getManualOSes()
        return await devicesFormat(data)

    } catch (e) {
        catchHandler(e, 'getOSes')
    }
}

const getManualOSes = () => {
    return {
        "android": 5,
        "ios": 3,
        "windows 10": 1,
        "windows 7": 1,
        "windows 8.1": 1,
        "other": 5,
        "windows xp": 1,
        "windows 8": 1,
        "blackberry os": 5,
        "windows phone": 6,
        "windows vista": 1,
        "mac os x": 4,
        "chrome os": 5,
        "linux": 2,
        "ubuntu": 2,
        "solaris": 2,
        "windows": 1,
        "mac os": 4,
        "windows rt": 6,
        "kindle": 5,
        "symbian os": 5,
        "bada": 5,
        "blackberry tablet os": 5,
        "windows rt 8.1": 1,
        "freebsd": 5,
        "nokia series 40": 5,
        "nokia series 30 plus": 5,
        "windows 2000": 1,
        "atv os x": 5,
        "gentoo": 2,
        "philips": 5,
        "meego": 5,
        "symbian^3": 5,
        "kubuntu": 2,
        "slackware": 2,
        "fedora": 2,
        "windows nt 4.0": 1,
        "windows 98": 1,
        "linux mint": 2,
        "windows 95": 1,
        "debian": 2,
        "symbian^3 belle": 5,
        "openbsd": 5,
        "windows me": 1,
        "googletv": 5,
        "netbsd": 5,
        "symbian^3 anna": 5,
        "webos": 2,
        "windows ce": 1,
        "firefox os": 5,
        "suse": 5,
        "mandriva": 5,
        "brew mp": 5,
        "brew": 5,
        "vre": 5,
        "bsd": 5,
        "windows mobile": 6,
        "centos": 2,
        "maemo": 5,
        "opensuse": 5,
        "windows nt": 1,
        "webtv": 5,
        "arch linux": 2,
        "windows 3.1": 1,
        "red hat": 5,
        "pclinuxos": 5,
        "umc": 5,
        "mageia": 5,
        "wetab": 5,
        "panasonic": 5,
        "samsung": 5,
        "firehbbtv": 5,
        "sony": 5,
        "puppy": 2,
        "roku": 2,
        "toshiba": 5
    }

}
module.exports = {
    getOSes
}