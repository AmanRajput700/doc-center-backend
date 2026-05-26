const jwt = require('jsonwebtoken');
const { ERROR_MESSAGE, STATUS_CODE } = require('../../utils/constant');
const generateAccessAndRefreshTokens = require('../../utils/tokenGenrator');
const TenantUserMap = require('../../models/root/TenantUserMap');
const Tenant = require('../../models/root/Tenant');
const getTenantModel = require('../../utils/getTenantModel');
const userSchema = require('../../models/tenant/userSchema');
const createHttpError = require('http-errors');

module.exports = async (incomingRefreshToken) => {
        const decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        const tenant = await TenantUserMap.findOne({ email: decoded.email }).populate('tenantId', 'dbName');
        if (!tenant) throw new createHttpError(STATUS_CODE.UNAUTHORIZED, ERROR_MESSAGE.INVALID_USER);
        const User = getTenantModel(tenant.tenantId.dbName, 'User', userSchema);
        const user = await User.findOne({ email: tenant.email }).select('+refreshToken');
        if (incomingRefreshToken !== user.refreshToken) throw new createHttpError(STATUS_CODE.UNAUTHORIZED, ERROR_MESSAGE.INVALID_USER);
        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(User, user._id, tenant);
        return { accessToken, refreshToken };
};
