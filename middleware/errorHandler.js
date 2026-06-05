const logger = require('../config/logger');

module.exports = function (err, req, res, next) {

    const statusCode = err.statusCode || err.status || 500;

    const logData = {
        statusCode,
        message: err.message,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        tenantId: req.tenant?._id,
        userId: req.user?._id
    };

    if (statusCode >= 500) {

        logger.error({
            action: 'UNHANDLED_ERROR',
            ...logData,
            stack: err.stack
        });

    } else {

        logger.warn({
            action: 'HANDLED_ERROR',
            ...logData,
            stack: err.stack
        });

    }

    return res.status(statusCode).json({
        success: false,
        statusCode,
        message: err.message || 'Internal Server Error',

        ...(process.env.NODE_ENV === 'development' && {
            stack: err.stack
        })
    });
};