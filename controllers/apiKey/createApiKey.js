const ApiKey = require('../../models/root/ApiKey');
const getTenantModel = require('../../utils/getTenantModel');
const userSchema = require('../../models/tenant/userSchema');
const generateApiKey = require('../../utils/generateApiKey');
const createHttpError = require('http-errors');
const { STATUS_CODE, ERROR_MESSAGE } = require('../../utils/constant');

module.exports = async function (apiData, tenant, userId) {
    const { name } = apiData;
    const { _id, dbName } = tenant;
    const rawApiKey = generateApiKey();
    const User = getTenantModel(dbName, 'User', userSchema);

    const user = await User.findById(userId).populate("role", "name");
    if (!user || !user.role || user.role.name !== 'Admin') throw new createHttpError(STATUS_CODE.FORBIDDEN, 'User not allowed to generate API key');

    await ApiKey.create({
        tenantId: _id,
        name,
        hashedKey: rawApiKey,
        createdBy: userId
    });

    return rawApiKey;
}