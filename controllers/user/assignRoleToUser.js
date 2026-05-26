const userSchema = require('../../models/tenant/userSchema');
const getTenantModel = require('../../utils/getTenantModel');
const createHttpError = require('http-errors');
const { STATUS_CODE, ERROR_MESSAGE } = require('../../utils/constant');
const redis = require('../../services/cache');


module.exports = async function (userId, roleId, dbName) {
    const User = getTenantModel(dbName, 'User', userSchema);

    const user = await User.findByIdAndUpdate(userId, { role: roleId }, { new: true });
    if (!user) throw new createHttpError(STATUS_CODE.NOT_FOUND, ERROR_MESSAGE.USER_NOT_FOUND);

    await redis.del(`user:${dbName}`);
    return user;
}