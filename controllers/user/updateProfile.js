const userSchema = require('../../models/tenant/userSchema');
const { STATUS_CODE, ERROR_MESSAGE } = require('../../utils/constant');
const createHttpError = require('http-errors');
const mongoose = require('mongoose');

module.exports = async function (userData, userId, dbName) {
    const { firstName, lastName } = userData;

    const tenantDB = mongoose.connection.useDb(dbName);
    const User = tenantDB.models.User || tenantDB.model('User', userSchema);

    const userExists = await User.findById(userId);
    if (!userExists) throw new createHttpError(STATUS_CODE.NOT_FOUND, ERROR_MESSAGE.USER_NOT_FOUND);

    const updatedUser = await User.findByIdAndUpdate(userId, { firstName, lastName }, { new: true }).select('-otpAttempts -failedLogInAttempts -lastLogin').lean();
    return updatedUser;
}