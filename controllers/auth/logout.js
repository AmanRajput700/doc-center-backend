const createHttpError = require('http-errors');
const userSchema = require('../../models/tenant/userSchema');
const { STATUS_CODE, ERROR_MESSAGE } = require('../../utils/constant');
const getTenantModel = require('../../utils/getTenantModel');

module.exports = async function (userId, dbName) {
    const User = getTenantModel(dbName, 'User', userSchema);
    const user = await User.findByIdAndUpdate(userId, { $unset: { refreshToken: 1 } });
    if (!user) throw new createHttpError(STATUS_CODE.UNAUTHORIZED, ERROR_MESSAGE.INVALID_USER);
}