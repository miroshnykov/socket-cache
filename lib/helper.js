const config = require('plain-config')()

const resolveLocation = async (segments, cities) => {

    try {
        let dimensions = []

        const {length} = segments

        for (let i = 0; i < length; i++) {
            if (segments[i].dimension === config.segment.dimension.geo) {
                dimensions = segments[i].value.split('/')

                if (dimensions.length === config.segment.location.city) {
                    dimensions[config.segment.location.city - 1] = cities[dimensions[config.segment.location.city - 1]]

                    segments[i].value = dimensions.join('/')
                }
            }
        }

        // console.log('resolveLocation segments:',segments)
        return segments

    } catch (err) {
        console.log(`\n*** Something happened, resolveLocation, err:`, err)
    }
}

const mapByPriorityNDimension = (segments) => {

    let output = {};
    let condition = {};

    const {length} = segments

    for (let i = 0; i < length; i++) {
        if (output[segments[i].priority] === undefined) {
            output[segments[i].priority] = {};
        }
        output[segments[i].priority].segment = segments[i].segment

        if (output[segments[i].priority].conditions === undefined) {
            output[segments[i].priority].conditions = []
        }

        output[segments[i].priority].name = segments[i].name;

        if (segments[i].filter && segments[i].dimension &&
            segments[i].matches && segments[i].value) // Not empty
        {
            condition = {
                filter: segments[i].filter,
                dimension: {
                    id: segments[i].id, // Statsd parameter
                    value: segments[i].dimension
                },
                match: segments[i].matches,
                value: segments[i].value
            }

            addCondition(output[segments[i].priority].conditions, condition);
        }
    }

    return output;
}

const addCondition = (conditions, condition) => {

    if (!dimensionExists(conditions, condition.dimension)) {
        conditions.push({
            dimension: condition.dimension,
            filter: {}
        });
    }

    addFilter(conditions, conditions.length - 1, condition);

}

const dimensionExists = (conditions, dimension) => {
    const {length} = conditions

    for (let i = 0; i < length; i++) {
        if (conditions[i].dimension.id === dimension.id) {
            return true
        }
    }

    return false
}

const addFilter = (conditions, index, condition) => {
    if (!filterExists(conditions[index].filter, condition.filter)) {
        conditions[index].filter = {
            rule: condition.filter,
            values: []
        }
    }

    conditions[index].filter.values.push({
        match: condition.match,
        value: condition.value
    })
}

const filterExists = (filter, rule) => {
    return filter.rule === rule
}

const mapBySegmentID = (landingPages) => {
    const __ = require('underscore')

    // console.log(landingPages)
    let output = {}

    const {length} = landingPages

    let landingPage

    for (let i = 0; i < length; i++) {
        if (output[landingPages[i].segment] === undefined) {
            output[landingPages[i].segment] = {}
        }

        if (output[landingPages[i].segment].landingPages === undefined) {
            output[landingPages[i].segment].landingPages = []
        }

        landingPage = {}

        landingPage.program_id = landingPages[i].program_id
        landingPage.product_id = landingPages[i].product_id
        landingPage.id = landingPages[i].id
        landingPage.weight = landingPages[i].weight
        landingPage.url = landingPages[i].url
        landingPage.static_url = (landingPages[i].static_url ? landingPages[i].static_url : false)
        landingPage.forced_url = landingPages[i].forced_landing_url || ''
        landingPage.name = landingPages[i].name; // For debugging purposes only

        if (!landingPage.url) {
            landingPage.prefix = landingPages[i].prefix
            landingPage.target = landingPages[i].target
            landingPage.extra_params = landingPages[i].extra_params
        } else {
            if (__.isArray(landingPage.url)) {
                landingPage.experiment = landingPages[i].ga_experiment_id
            }
        }

        output[landingPages[i].segment].landingPages.push(landingPage)
    }
    return output
}

const resolveURL = (landingPages, target) => {
    const {length} = landingPages

    let queryString = ''
    let mark = ''

    for (let i = 0; i < length; i++) {
        if (landingPages[i].static_url) {
            landingPages[i].url = landingPages[i].static_url
        } else {
            if (landingPages[i].forced_landing_url) {
                if (landingPages[i].forced_landing_url.substr(-1) !== '/') {
                    landingPages[i].forced_landing_url += '/'
                }

                landingPages[i].url = landingPages[i].forced_landing_url; // + '?';

                queryString = resolveTargetVsExtra(landingPages[i].target, landingPages[i].extra_params)
                mark = queryString ? '?' : ''
                landingPages[i].url += target + mark + queryString
            } else {
                landingPages[i].url = ''
            }
        }
    }
    return landingPages
}

const resolveTargetVsExtra = (target, extraParameters) => {
    const __ = require('underscore')

    if (__.isEmpty(target) && __.isEmpty(extraParameters)) {
        return ''
    }
    if (__.isEmpty(target)) {
        return extraParameters
    }
    if (__.isEmpty(extraParameters)) {
        return target
    }

    const queryString = require('querystring')
    const deepDiff = require('deep-diff')

    let diffFlagEdit = 'E'; // Indicates a property/element was edited (@see https://www.npmjs.com/package/deep-diff)
    // Also, indicates LHS (Target field value) should prevail over RHS (Extra Parameters field value)
    let diffFlagDel = 'D'; // Indicates a property/element was deleted

    let qs = ''
    let param = ''

    let qsTarget = queryString.parse(target);
    let qsExtra = queryString.parse(extraParameters);

    let diff = deepDiff.diff(qsTarget, qsExtra);
    let length = diff.length;

    for (let i = 0; i < length; i++) {
        if (diff[i].kind === diffFlagEdit || diff[i].kind === diffFlagDel) {
            param = __.isArray(diff[i].lhs) ? diff[i].lhs[0] : diff[i].lhs
        } else {
            param = __.isArray(diff[i].rhs) ? diff[i].rhs[0] : diff[i].rhs
        }

        qs += '&' + diff[i].path[0] + '=' + param;
    }
    return qs.substr(1)
}

const distributeWeights = (landingPages, scale) => {
    let total = 0
    let ratio = 0

    for (let index in landingPages) {
        total = computeTotalWeights(landingPages[index].landingPages)
        ratio = scale / total
        distributeTotalWeights(landingPages[index].landingPages, ratio)
    }
    return landingPages
}

const computeTotalWeights = (landingPages) => {
    let total = 0

    const {length} = landingPages

    for (let i = 0; i < length; i++) {
        total += landingPages[i].weight
    }
    return total
}

const distributeTotalWeights = (landingPages, ratio) => {
    let addition = 0

    const {length} = landingPages

    for (let i = 0; i < length; i++) {
        addition += landingPages[i].weight
        landingPages[i].weight = Math.round(addition * ratio)
    }
}

const lpSegmentMerge = (segments, landingPages) => {
    const __ = require('underscore')

    let output = []
    let iOutput = 0

    for (let i in segments) {
        i = ~~i // Convert string to number

        // Segment has no Landing Page attached to it (edge case)
        if (!__.isUndefined(landingPages[segments[i].segment])) {
            output.push({
                priority: i, // Optional, just visual - could be removed
                segment: {
                    id: segments[i].segment, // Statsd parameter
                    conditions: segments[i].conditions
                },
                landingPages: landingPages[segments[i].segment].landingPages
            });

            output[iOutput].name = segments[i].name
            ++iOutput
        }
    }
    return output.reverse()
}

const convertTime = (timestamp) => {
    let months_arr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let date = new Date(timestamp * 1000);
    let year = date.getFullYear();
    let month = months_arr[date.getMonth()];
    let day = date.getDate();
    let hours = date.getHours();
    let minutes = "0" + date.getMinutes();
    let seconds = "0" + date.getSeconds();
    let convdataTime = month + '-' + day + '-' + year + ' ' + hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
    return convdataTime
}

const currentTime = () => {
    let date = new Date()
    let current = ~~(date.getTime() / 1000)
    return convertTime(current)
}

const affiliateWebsitesFormat = (websites) => {
    let map = {}
    websites.forEach((website) => {
        map[website.id] = website
    })
    return map
}

const adUnitsFormat = (adUnits) => {
    let map = {};
    const {length} = adUnits
    for (let i = 0; i < length; i++) {
        map[adUnits[i].id] = adUnits[i]
    }
    return map
}

const affInfoFormat = (affInfo) => {
    let map = {}

    const {length} = affInfo

    for (let i = 0; i < length; i++) {
        map[affInfo[i].id] = affInfo[i]
    }
    return map
}

const campaignsFormat = (campaigns) => {
    let map = {}

    const {length} = campaigns

    for (let i = 0; i < length; i++) {
        map[campaigns[i].id] = campaigns[i]
    }
    return map
}

const dimensionsFormat = (dimensions) => {
    let map = {};

    const {length} = dimensions

    for (let i = 0; i < length; i++) {
        map[dimensions[i].name] = dimensions[i].id;
    }
    return map
}

const advertisersProductsFormat = (advertisersProducts) => {
    let map = {}
    const {length} = advertisersProducts

    for (let i = 0; i < length; i++) {
        map[advertisersProducts[i].advertiser_product_id] = advertisersProducts[i]
    }
    return map
}

const randomSitesFormat = (randomSites) => {
    let urls = [];

    const {length} = randomSites.url_sites.media
    let total = 0;

    for (let i = 0; i < length; i++) {
        if (randomSites.url_sites.media[i].advertising_percentage !== '0') {
            total += ~~randomSites.url_sites.media[i].advertising_percentage
            urls.push({
                id: ~~randomSites.url_sites.media[i].id,
                url: randomSites.url_sites.media[i].url,
                weight: total
            })
        }
    }
    return urls
}

const devicesFormat = (devices) => {
    for (let index in devices) {
        devices[index] += ''
    }
    return devices
}

const memorySizeOf = (obj) => {
    let bytes = 0;

    const sizeOf = (obj) => {
        if (obj !== null && obj !== undefined) {
            switch (typeof obj) {
                case 'number':
                    bytes += 8;
                    break;
                case 'string':
                    bytes += obj.length * 2;
                    break;
                case 'boolean':
                    bytes += 4;
                    break;
                case 'object':
                    let objClass = Object.prototype.toString.call(obj).slice(8, -1);
                    if (objClass === 'Object' || objClass === 'Array') {
                        for (let key in obj) {
                            if (!obj.hasOwnProperty(key)) continue;
                            sizeOf(obj[key]);
                        }
                    } else bytes += obj.toString().length * 2;
                    break;
            }
        }
        return bytes
    };

    const formatByteSize = (bytes) => {
        if (bytes < 1024) return bytes + " bytes"
        else if (bytes < 1048576) return (bytes / 1024).toFixed(3) + " KiB"
        else if (bytes < 1073741824) return (bytes / 1048576).toFixed(3) + " MiB"
        else return (bytes / 1073741824).toFixed(3) + " GiB"
    }

    return formatByteSize(sizeOf(obj))
};

const memorySizeOfBite = (obj) => {
    let bytes = 0;

    const sizeOf = (obj) => {
        if (obj !== null && obj !== undefined) {
            switch (typeof obj) {
                case 'number':
                    bytes += 8;
                    break;
                case 'string':
                    bytes += obj.length * 2;
                    break;
                case 'boolean':
                    bytes += 4;
                    break;
                case 'object':
                    let objClass = Object.prototype.toString.call(obj).slice(8, -1);
                    if (objClass === 'Object' || objClass === 'Array') {
                        for (let key in obj) {
                            if (!obj.hasOwnProperty(key)) continue;
                            sizeOf(obj[key]);
                        }
                    } else bytes += obj.toString().length * 2;
                    break;
            }
        }
        return bytes
    };

    return sizeOf(obj)
};

const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

module.exports = {
    resolveLocation,
    mapByPriorityNDimension,
    mapBySegmentID,
    resolveURL,
    distributeWeights,
    lpSegmentMerge,
    currentTime,
    adUnitsFormat,
    dimensionsFormat,
    randomSitesFormat,
    devicesFormat,
    advertisersProductsFormat,
    affInfoFormat,
    campaignsFormat,
    affiliateWebsitesFormat,
    memorySizeOf,
    memorySizeOfBite,
    formatBytes
}

