const getTenantModel = require('../../utils/getTenantModel');
const documentSchema = require('../../models/tenant/documentSchema');
const userSchema = require('../../models/tenant/userSchema');
const storageSchema = require('../../models/tenant/storageSchema');
const apiAnalyticsSchema = require('../../models/tenant/apiAnalyticsSchema');
const plans = require('../../config/plans');
const { getAnalyticsBucket } = require('../../services/analyticsService');

module.exports = async function (tenant) {

    const { dbName, _id: tenantId, currentPlan } = tenant;

    const Document = getTenantModel(dbName, 'Document', documentSchema);
    const Storage = getTenantModel(dbName, 'Storage', storageSchema);
    const ApiAnalytics = getTenantModel(dbName, 'ApiAnalytics', apiAnalyticsSchema);

    const lastSevenDays = new Date();
    lastSevenDays.setDate(lastSevenDays.getDate() - 7);

    const analyticsFrom = getAnalyticsBucket();

    if (process.env.ANALYTICS_INTERVAL === 'minute') {
        analyticsFrom.setMinutes(analyticsFrom.getMinutes() - 29);
    } else {
        analyticsFrom.setDate(analyticsFrom.getDate() - 29);
    }

    const [storageDetails, docsAddedThisWeek] = await Promise.all([

        Storage.findOne({ tenantId }).lean(),

        Document.countDocuments({
            isDeleted: false,
            uploadStatus: 'uploaded',
            createdAt: {
                $gte: lastSevenDays
            }
        })
    ]);

    const apiAnalytics = await ApiAnalytics.find({})
        .sort({ date: -1 })
        .limit(30)
        .lean();

    apiAnalytics.reverse();


    const totalApiRequests = apiAnalytics.reduce(
        (total, item) => total + item.requests,
        0
    );

    return {
        storageDetails,
        planDetails: plans[currentPlan],
        docsAddedThisWeek,
        apiAnalytics: {
            totalRequests: totalApiRequests,
            requestsOverTime: apiAnalytics
        }
    };
};