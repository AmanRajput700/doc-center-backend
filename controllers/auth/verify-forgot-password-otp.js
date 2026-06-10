const createHttpError = require('http-errors');
const crypto = require('node:crypto');
const TenantUserMap = require('../../models/root/TenantUserMap');
const getTenantModel = require('../../utils/getTenantModel');
const userSchema = require('../../models/tenant/userSchema');
const { ERROR_MESSAGE, STATUS_CODE } = require('../../utils/constant');
const TIME = require('../../utils/times');
const redis = require('../../services/cache');

module.exports = async function (userData) {
    const { otp, email, slug } = userData;
    const hashedOtp = crypto.createHash('sha256').update(String(otp)).digest('hex');
    const tenant = await TenantUserMap.findOne({ email }).populate('tenantId', 'dbName');
    if (!tenant) throw new createHttpError(STATUS_CODE.UNPROCESSABLE_ENTITY, ERROR_MESSAGE.INVALID_OTP);

    const User = getTenantModel(tenant.tenantId.dbName, 'User', userSchema);
    const user = await User.findOne({ email });
    if (!user) throw new createHttpError(STATUS_CODE.UNPROCESSABLE_ENTITY, ERROR_MESSAGE.INVALID_OTP);

    const otpBlockedUntil = await redis.get(`otp_blocked:${slug}:${user._id}`);
    if (otpBlockedUntil) {
        throw new createHttpError(STATUS_CODE.TOO_MANY_REQUESTS, ERROR_MESSAGE.TOO_MANY_OTP_ATTEMPTS);
    }
    // if (user.otpBlockedUntil && user.otpBlockedUntil > Date.now()) {
    //     throw new createHttpError(STATUS_CODE.TOO_MANY_REQUESTS, ERROR_MESSAGE.TOO_MANY_OTP_ATTEMPTS);
    // }

    const userOtp = await redis.get(`otp:${slug}:${user._id}`);
    if (!userOtp) {
        throw createHttpError(STATUS_CODE.UNPROCESSABLE_ENTITY, ERROR_MESSAGE.OTP_EXPIRED);
    }
    const isValidOtp = userOtp === hashedOtp;

    if (!isValidOtp) {
        const attempts = await redis.incr(`otp_attempts:${slug}:${user._id}`);
        const remainingAttempts = TIME.MAX_OTP_ATTEMPTS - attempts;

        if (attempts >= TIME.MAX_OTP_ATTEMPTS) {
            const pipeline = redis.multi();
            pipeline.set(`otp_blocked:${slug}:${user._id}`, Date.now() + TIME.OTP_BLOCKED_UNTIL, 'PX', TIME.OTP_BLOCKED_UNTIL);
            pipeline.del(`otp_attempts:${slug}:${user._id}`);
            pipeline.del(`otp:${slug}:${user._id}`);
            await pipeline.exec();
            throw createHttpError(STATUS_CODE.TOO_MANY_REQUESTS, ERROR_MESSAGE.TOO_MANY_OTP_ATTEMPTS);
        }
        throw new createHttpError(STATUS_CODE.UNPROCESSABLE_ENTITY, `Remaining otp attempts ${remainingAttempts}`);
    }

    const pipeline = redis.multi();
    pipeline.del(`otp:${slug}:${user._id}`);
    pipeline.del(`otp_attempts:${slug}:${user._id}`);
    pipeline.del(`otp_blocked:${slug}:${user._id}`);
    await pipeline.exec();
    const resetPasswordToken = user.generateResetPasswordToken();
    await user.save();

    return resetPasswordToken;
}