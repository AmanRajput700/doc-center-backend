const validateApiKey = require('../../services/sdk/validateApiKey');
const verifySSOToken = require('../../services/sdk/verifySSOToken');
const userSchema = require('../../models/tenant/userSchema');
const getTenantModel = require('../../utils/getTenantModel');
const createHttpError = require('http-errors');
const { STATUS_CODE, ERROR_MESSAGE } = require('../../utils/constant');
const tokenGenrator = require('../../utils/tokenGenrator');

module.exports = async function ({ apiKey, token }) {

    const tenantApiKey = await validateApiKey(apiKey);
    const payload = await verifySSOToken(tenantApiKey, token);

    const User = getTenantModel(tenantApiKey.tenantId.dbName, 'User', userSchema);

    const user = await User.findOne({ email: payload.email });
    if (!user) throw new createHttpError(STATUS_CODE.UNAUTHORIZED, ERROR_MESSAGE.INVALID_API_KEY);

    const { refreshToken, accessToken } = await tokenGenrator(User, user._id, tenantApiKey);
    return { refreshToken, accessToken };
}