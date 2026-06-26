const jwt = require('jsonwebtoken');
const { ERROR_MESSAGE, STATUS_CODE } = require('../../utils/constant');
const generateAccessAndRefreshTokens = require('../../utils/tokenGenrator');
const TenantUserMap = require('../../models/root/TenantUserMap');
const getTenantModel = require('../../utils/getTenantModel');
const userSchema = require('../../models/tenant/userSchema');
const createHttpError = require('http-errors');
const { findSessionByRefreshToken, rotateSession } = require('../../services/auth/sessionService');

module.exports = async (incomingRefreshToken) => {
        const decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        const tenant = await TenantUserMap.findOne({ email: decoded.email }).populate('tenantId', 'dbName');
        if (!tenant) throw new createHttpError(STATUS_CODE.UNAUTHORIZED, ERROR_MESSAGE.INVALID_USER);

        const session = await findSessionByRefreshToken({
                dbName: tenant.tenantId.dbName,
                refreshToken: incomingRefreshToken
        });

        if (!session) throw new createHttpError(STATUS_CODE.UNAUTHORIZED, ERROR_MESSAGE.INVALID_USER);

        const User = getTenantModel(tenant.tenantId.dbName, 'User', userSchema);
        const user = await User.findById(session.userId);
        if (!user) throw new createHttpError(STATUS_CODE.UNAUTHORIZED, ERROR_MESSAGE.INVALID_USER);

        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(User, user._id, tenant);
        await rotateSession({
                dbName: tenant.tenantId.dbName,
                oldRefreshToken: incomingRefreshToken,
                newRefreshToken: refreshToken
        });
        return { accessToken, refreshToken };
};
