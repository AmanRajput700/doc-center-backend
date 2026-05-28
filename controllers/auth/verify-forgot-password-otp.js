const createHttpError = require('http-errors');
const crypto = require('node:crypto');
const TenantUserMap = require('../../models/root/TenantUserMap');
const getTenantModel = require('../../utils/getTenantModel');
const userSchema = require('../../models/tenant/userSchema');
const { ERROR_MESSAGE, STATUS_CODE } = require('../../utils/constant');
const TIME = require('../../utils/times');

module.exports = async function (userData) {
    const { otp, email, slug } = userData;
    const hashedOtp = crypto.createHash('sha256').update(String(otp)).digest('hex');
    const tenant = await TenantUserMap.findOne({ email }).populate('tenantId', 'dbName');
    if (!tenant) throw new createHttpError(STATUS_CODE.UNPROCESSABLE_ENTITY, ERROR_MESSAGE.INVALID_OTP);

    const User = getTenantModel(tenant.tenantId.dbName, 'User', userSchema);
    const user = await User.findOne({ email });
    if (!user) throw new createHttpError(STATUS_CODE.UNPROCESSABLE_ENTITY, ERROR_MESSAGE.INVALID_OTP);

    if (user.otpBlockedUntil && user.otpBlockedUntil > Date.now()) {
        throw new createHttpError(STATUS_CODE.TOO_MANY_REQUESTS, ERROR_MESSAGE.TOO_MANY_OTP_ATTEMPTS);
    }

    const isValidOtp = user.otp === hashedOtp && user.otpExpiry > Date.now();

    if (!isValidOtp) {
        user.otpAttempts += 1;
        const remainingAttempts = TIME.MAX_OTP_ATTEMPTS - user.otpAttempts;
        if (user.otpAttempts >= TIME.MAX_OTP_ATTEMPTS - 1) {
            user.otpBlockedUntil = Date.now() + TIME.OTP_BLOCKED_UNTIL;
            user.otpAttempts = 0;
        }
        await user.save();
        throw new createHttpError(STATUS_CODE.UNPROCESSABLE_ENTITY, `Remaining otp attempts ${remainingAttempts}`);
    }

    user.otp = undefined;
    user.otpExpiry = undefined;
    user.otpAttempts = 0;
    user.otpBlockedUntil = undefined;
    const resetPasswordToken = user.generateResetPasswordToken();
    await user.save();

    return resetPasswordToken;
}