const createHttpError = require('http-errors')
const asyncHandler = (fn) => async (req, res, next) => {
    try {
        await fn(req, res, next);
    } catch (err) {
        next(createHttpError(err));
    }
}

module.exports = asyncHandler;