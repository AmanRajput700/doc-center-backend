const createHttpError = require('http-errors');
const TenantUserMap = require('../../models/root/TenantUserMap');
const { STATUS_CODE, ERROR_MESSAGE } = require('../../utils/constant');
const crypto = require('node:crypto');
const getTenantModel = require('../../utils/getTenantModel');
const userSchema = require('../../models/tenant/userSchema');
const passwordChangedSuccessfullyEmail = require('../../utils/emails/passwordChangedSuccessfully');

module.exports = async function (userData) {
    const { email, token, password, confirmPassword } = userData;
    if (password !== confirmPassword) throw new createHttpError(STATUS_CODE.BAD_REQUEST, ERROR_MESSAGE.PASSWORD_MISMATCH);
    const normalizedEmail = email.trim().toLowerCase();
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const tenant = await TenantUserMap.findOne({ email: normalizedEmail }).populate("tenantId", " dbName ");
    if (!tenant) throw new createHttpError(STATUS_CODE.UNPROCESSABLE_ENTITY, ERROR_MESSAGE.INVALID_CREDENTIALS);

    const User = getTenantModel(tenant.tenantId.dbName, 'User', userSchema);

    const user = await User.findOne({ email: normalizedEmail, resetPasswordToken: hashedToken, resetPasswordTokenExpiry: { $gt: Date.now() } });
    if (!user) throw new createHttpError(STATUS_CODE.UNPROCESSABLE_ENTITY, ERROR_MESSAGE.INVALID_CREDENTIALS);

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpiry = undefined;
    user.failedLogInAttempts = 0;
    user.lockUntil = undefined;
    await user.save();
    try {
        await passwordChangedSuccessfullyEmail(tenant.tenantId.orgName, user.firstName, user.lastName, user.email);
    } catch (error) {
        console.error(error);
    }

};