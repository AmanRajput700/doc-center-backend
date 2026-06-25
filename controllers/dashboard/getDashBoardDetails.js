const getTenantModel = require('../../utils/getTenantModel');
const documentSchema = require('../../models/tenant/documentSchema');
const userSchema = require('../../models/tenant/userSchema');
const storageSchema = require('../../models/tenant/storageSchema');
const apiAnalyticsSchema = require('../../models/tenant/apiAnalyticsSchema');
const plans = require('../../config/plans');

module.exports = async function (tenant) {

    const { dbName, _id: tenantId, currentPlan } = tenant;

    const Document = getTenantModel(dbName, 'Document', documentSchema);
    const User = getTenantModel(dbName, 'User', userSchema);
    const Storage = getTenantModel(dbName, 'Storage', storageSchema);
    const ApiAnalytics = getTenantModel(dbName, 'ApiAnalytics', apiAnalyticsSchema);


    const lastSevenDays = new Date();
    lastSevenDays.setDate(lastSevenDays.getDate() - 7);

    const lastThirtyDays = new Date();
    lastThirtyDays.setHours(0, 0, 0, 0);
    lastThirtyDays.setDate(lastThirtyDays.getDate() - 29);

    const [storageDetails, docsAddedThisWeek, apiAnalytics] = await Promise.all([

        Storage.findOne({ tenantId }),

        Document.countDocuments({
            isDeleted: false,
            uploadStatus: 'uploaded',
            createdAt: {
                $gte: lastSevenDays
            }
        }),

        ApiAnalytics.find({
            date: {
                $gte: lastThirtyDays
            }
        })
            .sort({ date: 1 })
            .lean()

    ]);

    const totalApiRequests = apiAnalytics.reduce(
        (total, day) => total + day.requests,
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