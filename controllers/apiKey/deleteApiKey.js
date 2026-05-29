const ApiKey = require('../../models/root/ApiKey');
const getTenantModel = require('../../utils/getTenantModel');
const userSchema = require('../../models/tenant/userSchema');
const generateApiKey = require('../../utils/generateApiKey');
const createHttpError = require('http-errors');
const { STATUS_CODE, ERROR_MESSAGE } = require('../../utils/constant');

module.exports = async function (apiKeyId, tenant, userId) {
    const { _id: tenantId, dbName } = tenant;
    const User = getTenantModel(dbName, 'User', userSchema);
    const user = await User.findById(userId).populate("role", "name");
    if (!user || !user.role || user.role.name !== 'Admin') throw new createHttpError(STATUS_CODE.FORBIDDEN, 'User not allowed to generate API key');

    const apiKey = await ApiKey.findById(apiKeyId);
    if (!apiKey) throw new createHttpError(STATUS_CODE.NOT_FOUND, ERROR_MESSAGE.API_NOT_FOUND);
    if (apiKey.tenantId.toString() !== tenantId.toString()) throw new createHttpError(STATUS_CODE.FORBIDDEN, ERROR_MESSAGE.INVALID_USER);
    const deletedApiKey = await ApiKey.findByIdAndDelete(apiKeyId);

    return deletedApiKey;
}