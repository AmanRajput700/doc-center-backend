const asyncHandler = require('../utils/asyncHandler');
const createHttpError = require('http-errors');
const jwt = require('jsonwebtoken');
const { ERROR_MESSAGE, STATUS_CODE } = require('../utils/constant');
const userSchema = require('../models/tenant/userSchema');
const roleSchema = require('../models/tenant/roleSchema');
const mongoose = require('mongoose');
const Tenant = require('../models/root/Tenant');

module.exports = asyncHandler(async function (req, res, next) {
    let token = null;

    if (req.cookies?.accessToken) {
        token = req.cookies.accessToken;
    } else if (req.headers.authorization?.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }

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

        const Role = tenantDB.models.Role || tenantDB.model('Role', roleSchema);
        const User = tenantDB.models.User || tenantDB.model('User', userSchema);

        const user = await User.findById(decoded._id).populate('role', 'name').select('-password -refreshToken');

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