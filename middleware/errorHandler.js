module.exports = function (err, req, res, next) {

    const statusCode = err.statusCode || err.status || 500;
    return res.status(statusCode).json({
        success: false,
        statusCode,
        message: err.message || 'Internal Server Error',

        ...(process.env.NODE_ENV === 'development' && {
            stack: err.stack
        })
    });
};