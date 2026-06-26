const jwt = require('jsonwebtoken');
const createHttpError = require('http-errors');
const {decrypt} = require('../../utils/encryption');
const { STATUS_CODE, ERROR_MESSAGE } = require('../../utils/constant');

module.exports = async function (tenantApiKey, token) {
    if (!token) throw new createHttpError(STATUS_CODE.UNAUTHORIZED, ERROR_MESSAGE.SSO_TOKEN_REQUIRED);

    const ssoSecret = decrypt(tenantApiKey.ssoSecret);

    try {
        const payload = jwt.verify(token, ssoSecret);
        return payload;
    } catch (error) {
        throw new createHttpError(STATUS_CODE.UNAUTHORIZED, ERROR_MESSAGE.INVALID_SSO_TOKEN);
    }
};