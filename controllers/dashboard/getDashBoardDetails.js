const getTenantModel = require('../../utils/getTenantModel');

const documentSchema = require('../../models/tenant/documentSchema');
const folderSchema = require('../../models/tenant/folderSchema');
const apiAnalyticsSchema = require('../../models/tenant/apiAnalyticsSchema');

const plans = require('../../config/plans');

const { getAnalyticsBucket } = require('../../services/analyticsService');

module.exports = async function (tenant) {

    const { dbName, currentPlan } = tenant;

    const Document = getTenantModel(dbName, 'Document', documentSchema);
    const Folder = getTenantModel(dbName, 'Folder', folderSchema);
    const ApiAnalytics = getTenantModel(dbName, 'ApiAnalytics', apiAnalyticsSchema);

    const lastSevenDays = new Date();
    lastSevenDays.setDate(lastSevenDays.getDate() - 7);

    const analyticsFrom = getAnalyticsBucket();

    if (process.env.ANALYTICS_INTERVAL === 'minute') {
        analyticsFrom.setMinutes(analyticsFrom.getMinutes() - 29);
    } else {
        analyticsFrom.setDate(analyticsFrom.getDate() - 29);
    }

    const [documentStats, totalFolders, docsAddedThisWeek, apiAnalytics] = await Promise.all([

        Document.aggregate([
            {
                $group: {
                    _id: null,

                    storageUsed: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        // { $eq: ['$isDeleted', false] },
                                        { $eq: ['$uploadStatus', 'uploaded'] }
                                    ]
                                },
                                '$size',
                                0
                            ]
                        }
                    },

                    totalFiles: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ['$isDeleted', false] },
                                        { $eq: ['$uploadStatus', 'uploaded'] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    },

                    trashedFiles: {
                        $sum: {
                            $cond: [
                                { $eq: ['$isDeleted', true] },
                                1,
                                0
                            ]
                        }
                    }
                }
            }
        ]),

        Folder.countDocuments({
            isDeleted: false
        }),

        Document.countDocuments({
            isDeleted: false,
            uploadStatus: 'uploaded',
            createdAt: {
                $gte: lastSevenDays
            }
        }),

        ApiAnalytics.find({
            date: {
                $gte: analyticsFrom
            }
        })
            .sort({ date: 1 })
            .lean()

    ]);

    const stats = documentStats[0] || {
        storageUsed: 0,
        totalFiles: 0,
        trashedFiles: 0
    };

    const totalApiRequests = apiAnalytics.reduce(
        (total, item) => total + item.requests,
        0
    );

    return {
        storageDetails: {
            storageUsed: stats.storageUsed,
            totalFiles: stats.totalFiles,
            totalFolders,
            trashedFiles: stats.trashedFiles
        },
        planDetails: plans[currentPlan],
        docsAddedThisWeek,
        apiAnalytics: {
            totalRequests: totalApiRequests,
            requestsOverTime: apiAnalytics
        }
    };
};