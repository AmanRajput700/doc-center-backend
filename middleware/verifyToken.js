const asyncHandler = require('../utils/asyncHandler');
const createHttpError = require('http-errors');
const jwt = require('jsonwebtoken');
const ERROR_MESSAGE = require('../utils/constant');
const userSchema = require('../models/tenant/userSchema');
const mongoose = require('mongoose');
const Tenant = require('../models/root/Tenant');

module.exports = asyncHandler(async function (req, res, next) {
    const authHeader = req.headers.authorization;

    const token = authHeader?.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : null;
    console.log("token", token)

    if (!token) throw new createHttpError(createHttpError.Unauthorized, ERROR_MESSAGE.INVALID_USER);
    let decoded;
    try {
        decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            throw new createHttpError(
                createHttpError.Unauthorized,
                'Access token expired'
            );
        }
        throw new createHttpError(createHttpError.Unauthorized, ERROR_MESSAGE.INVALID_USER);
    }
    console.log(decoded);
    const tenant = await Tenant.findById(decoded.tenantId);
    if (!tenant) throw new createHttpError(createHttpError.Unauthorized, ERROR_MESSAGE.INVALID_USER);

    const tenantDB = mongoose.connection.useDb(tenant.dbName);

    const User = tenantDB.models.User || tenantDB.model('User', userSchema);

    const user = await User.findById(decoded._id).select('-password -refreshToken');;

    if (!user) throw new createHttpError(createHttpError.Unauthorized, ERROR_MESSAGE.INVALID_USER);
    req.user = user;
    req.tenantDb = tenantDB;

    next();
});