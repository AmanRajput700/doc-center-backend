const { updateApiAnalytics } = require('../services/analyticsService');

module.exports = function (req, res, next) {

    res.on('finish', async () => {
        try {

            if (res.statusCode >= 400) {
                return;
            }

            if (!req.tenant?.dbName) {
                return;
            }

            await updateApiAnalytics({
                dbName: req.tenant.dbName,
                inc: {
                    requests: 1
                }
            });

        } catch (error) {
            console.error('API Analytics:', error.message);
        }
    });

    next();
};