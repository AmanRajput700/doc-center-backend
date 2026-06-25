const getTenantModel = require('../utils/getTenantModel');
const apiAnalyticsSchema = require('../models/tenant/apiAnalyticsSchema');

module.exports = function (req, res, next) {

    res.on('finish', async () => {

        try {
            if (res.statusCode >= 400) return;

            const ApiAnalytics = getTenantModel(req.tenant.dbName, 'ApiAnalytics', apiAnalyticsSchema);

            // Today's date (00:00:00)
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            await ApiAnalytics.findOneAndUpdate(
                {
                    date: today
                },
                {
                    $inc: {
                        requests: 1
                    }
                },
                {
                    upsert: true,
                    new: true
                }
            );

        } catch (err) {
            console.error('API Analytics:', err.message);
        }
    });
    next();
};