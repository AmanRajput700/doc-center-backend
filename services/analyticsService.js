const getTenantModel = require('../utils/getTenantModel');
const apiAnalyticsSchema = require('../models/tenant/apiAnalyticsSchema');

function getAnalyticsBucket() {

    const date = new Date();

    if (process.env.ANALYTICS_INTERVAL === 'minute') {
        date.setSeconds(0, 0);
    } else {
        date.setHours(0, 0, 0, 0);
    }

    return date;
}

const updateApiAnalytics = async function ({ dbName, inc = {}, set = {} }) {

    const ApiAnalytics = getTenantModel(
        dbName,
        'ApiAnalytics',
        apiAnalyticsSchema
    );

    const update = {};

    if (Object.keys(inc).length) {
        update.$inc = inc;
    }

    if (Object.keys(set).length) {
        update.$set = set;
    }

    update.$setOnInsert = {};

    if (!update.$inc?.requests) {
        update.$setOnInsert.requests = 0;
    }

    if (update.$set?.storageUsed === undefined) {
        update.$setOnInsert.storageUsed = 0;
    }

    await ApiAnalytics.findOneAndUpdate(
        {
            date: getAnalyticsBucket()
        },
        update,
        {
            upsert: true,
            new: true
        }
    );
};

module.exports = {
    updateApiAnalytics,
    getAnalyticsBucket
};