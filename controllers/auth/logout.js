const jwt = require('jsonwebtoken');
const createHttpError = require('http-errors');
const TenantUserMap = require('../../models/root/TenantUserMap');
const { deleteSession } = require('../../services/auth/sessionService');
const { STATUS_CODE, ERROR_MESSAGE } = require('../../utils/constant');

module.exports = async function (refreshToken) {

    if (!refreshToken) throw new createHttpError(STATUS_CODE.BAD_REQUEST, 'Refresh token is required');
    let decoded;

    try {
        decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (error) {
        throw new createHttpError(STATUS_CODE.UNAUTHORIZED, ERROR_MESSAGE.INVALID_USER);
    }

    const tenant = await TenantUserMap.findOne({ email: decoded.email }).populate('tenantId', 'dbName');
    if (!tenant) throw new createHttpError(STATUS_CODE.UNAUTHORIZED, ERROR_MESSAGE.INVALID_USER);

    const session = await deleteSession({
        dbName: tenant.tenantId.dbName,
        refreshToken
    });

    if (!session) throw new createHttpError(STATUS_CODE.UNAUTHORIZED, ERROR_MESSAGE.INVALID_USER);
    return;
};