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


module.exports = {
    resolveLocation,
    mapByPriorityNDimension,
    mapBySegmentID,
    resolveURL,
    distributeWeights,
    lpSegmentMerge
}

