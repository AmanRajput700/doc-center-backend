const getTenantModel = require('../../utils/getTenantModel');
const apiAnalyticsSchema = require('../../models/tenant/apiAnalyticsSchema');

const getAnalyticsBucket = function () {

    const date = new Date();

    if (process.env.ANALYTICS_INTERVAL === 'minute') {
        date.setSeconds(0, 0);
    } else {
        date.setHours(0, 0, 0, 0);
    }

    return date;
}

const updateApiAnalytics = async function ({ dbName, inc = {}, set = {} }) {

    const ApiAnalytics = getTenantModel(dbName, 'ApiAnalytics', apiAnalyticsSchema);

    const update = {
        $setOnInsert: {
            requests: 0,
            storageUsed: 0
        }
    };

    if (Object.keys(inc).length) {
        update.$inc = inc;
    }

    if (Object.keys(set).length) {
        update.$set = set;
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
}