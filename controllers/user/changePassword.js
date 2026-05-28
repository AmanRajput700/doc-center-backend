const userSchema = require('../../models/tenant/userSchema');
const { STATUS_CODE, ERROR_MESSAGE } = require('../../utils/constant');
const createHttpError = require('http-errors');
const getTenantModel = require('../../utils/getTenantModel');

module.exports = async function (data, userId, dbName) {
    const { currentPassword, newPassword, confirmPassword } = data;

    if (newPassword !== confirmPassword) throw new createHttpError(STATUS_CODE.CONFLICT, ERROR_MESSAGE.PASSWORD_MISMATCH);

    const User = getTenantModel(dbName, 'User', userSchema);

    const user = await User.findById(userId).select('+password');
    if (!user) throw new createHttpError(STATUS_CODE.NOT_FOUND, ERROR_MESSAGE.USER_NOT_FOUND);

    const isValidUser = await user.comparePassword(currentPassword);
    if (!isValidUser) throw new createHttpError(STATUS_CODE.UNAUTHORIZED, 'Wrong Current Password');

    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) throw new createHttpError(STATUS_CODE.CONFLICT, 'New password is same as Old password');

    user.password = newPassword;
    await user.save();
    return;
}