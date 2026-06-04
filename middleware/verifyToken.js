const asyncHandler = require('../utils/asyncHandler');
const createHttpError = require('http-errors');
const jwt = require('jsonwebtoken');
const { ERROR_MESSAGE, STATUS_CODE } = require('../utils/constant');
const userSchema = require('../models/tenant/userSchema');
const roleSchema = require('../models/tenant/roleSchema');
const getTenantModel = require('../utils/getTenantModel');
const Tenant = require('../models/root/Tenant');

module.exports = asyncHandler(async function (req, res, next) {
    let token = null;

    if (req.headers.authorization?.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.accessToken) {
        token = req.cookies.accessToken;
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

        const Role = getTenantModel(tenant.dbName, 'Role', roleSchema);
        const User = getTenantModel(tenant.dbName, 'User', userSchema);

        const user = await User.findById(decoded._id).populate('role', 'name').select('-password -refreshToken');

        if (!user) {
            throw new createHttpError(STATUS_CODE.UNAUTHORIZED, ERROR_MESSAGE.INVALID_USER);
        }

        const now = Date.now();

        const lastActive = new Date(user.lastActivateAt).getTime();

        const difference = now - lastActive;

        if (difference > 1000 * 60 * 5 || user.lastActivateAt === undefined) {
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