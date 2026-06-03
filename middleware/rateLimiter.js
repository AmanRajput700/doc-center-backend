const rateLimit = require('express-rate-limit');

module.exports = function createRateLimiter(minutes, max, message) {
    return rateLimit({
        windowMs: minutes * 60 * 1000,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            success: false,
            message
        },
        handler: (req, res) => {
            return res.status(429).json({
                success: false,
                message
            });
        }
    });
};