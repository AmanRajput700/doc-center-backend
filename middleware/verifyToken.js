const asyncHandler = require('../utils/asyncHandler');
const createHttpError = require('http-errors');

const { authenticateUser } = require('../services/authService');

module.exports = asyncHandler(async function (req, res, next) {

    let token = null;

    if (req.headers.authorization?.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.accessToken) {
        token = req.cookies.accessToken;
    }

    const { user, tenant } =await authenticateUser(token);

    const now = Date.now();
    const lastActive =new Date(user.lastActivateAt).getTime();
    const difference = now - lastActive;

    if (difference > 1000 * 60 * 5 ||user.lastActivateAt === undefined) {
        user.lastActivateAt = new Date();
        await user.save({validateBeforeSave: false});
    }

    req.user = user;
    req.tenant = tenant;

    next();
});