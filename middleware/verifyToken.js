const asyncHandler = require('../utils/asyncHandler');
const createHttpError = require('http-errors');
const jwt = require('jsonwebtoken');
const { ERROR_MESSAGE, STATUS_CODE } = require('../utils/constant');
const userSchema = require('../models/tenant/userSchema');
const mongoose = require('mongoose');
const Tenant = require('../models/root/Tenant');

module.exports = asyncHandler(async function (req, res, next) {
    const authHeader = req.headers.authorization;

    const token = authHeader?.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : null;

    if (!token) {
        throw new createHttpError(STATUS_CODE.UNAUTHORIZED, ERROR_MESSAGE.INVALID_USER);
    }

    try {
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                throw new createHttpError(STATUS_CODE.UNAUTHORIZED, 'Access token expired');
            }
            throw new createHttpError(STATUS_CODE.UNAUTHORIZED, ERROR_MESSAGE.INVALID_USER);
        }

        const tenant = await Tenant.findById(decoded.tenantId);

        if (!tenant) {
            throw new createHttpError(STATUS_CODE.UNAUTHORIZED, ERROR_MESSAGE.INVALID_USER);
        }

        const tenantDB = mongoose.connection.useDb(tenant.dbName);

        const User = tenantDB.models.User || tenantDB.model('User', userSchema);

        const user = await User.findById(decoded._id).select('-password -refreshToken');

        if (!user) {
            throw new createHttpError(STATUS_CODE.UNAUTHORIZED, ERROR_MESSAGE.INVALID_USER);
        }

        const now = Date.now();

        const lastActive = new Date(user.lastActivateAt).getTime();

        const difference = now - lastActive;

        if (difference > 1000 * 60 * 5) {
            user.lastActivateAt = new Date();
            await user.save({ validateBeforeSave: false });
        }
        req.user = user;
        req.tenant = tenant;
        next();
    } catch (error) {
        next(createHttpError(401, 'Unauthinticaed user'));
    }
});