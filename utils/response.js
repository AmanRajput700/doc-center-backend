const http = require('http');

const success = (res, data = null, message = "Success", statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        statusText: http.STATUS_CODES[statusCode] || "Success",
        data
    });
};

module.exports = success;