const jwt = require('jsonwebtoken');
const createHttpError = require('http-errors');

const Tenant = require('../models/root/Tenant');
const userSchema = require('../models/tenant/userSchema');
const roleSchema = require('../models/tenant/roleSchema');

const getTenantModel = require('../utils/getTenantModel');
const { ERROR_MESSAGE, STATUS_CODE } = require('../utils/constant');

async function authenticateUser(token) {

    if (!token) throw new createHttpError(STATUS_CODE.UNAUTHORIZED,ERROR_MESSAGE.INVALID_USER);

    let decoded;
    try {
        decoded = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
    } catch (err) {
        if (err.name === 'TokenExpiredError') throw new createHttpError(STATUS_CODE.UNAUTHORIZED,'Access token expired');

        throw new createHttpError(STATUS_CODE.UNAUTHORIZED,ERROR_MESSAGE.INVALID_USER);
    }

    const tenant = await Tenant.findById(decoded.tenantId);

    if (!tenant) throw new createHttpError(STATUS_CODE.UNAUTHORIZED, ERROR_MESSAGE.INVALID_USER);

    const User = getTenantModel(tenant.dbName, 'User', userSchema);
    const Role = getTenantModel(tenant.dbName, 'Role', roleSchema);

    const user = await User.findById(decoded._id)
        .populate('role', 'name')
        .select('-password -refreshToken');

    if (!user) throw new createHttpError(STATUS_CODE.UNAUTHORIZED, ERROR_MESSAGE.INVALID_USER);

    return {
        user,
        tenant,
        decoded
    };
}

module.exports = {
    authenticateUser
};