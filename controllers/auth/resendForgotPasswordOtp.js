const TenantUserMap = require('../../models/root/TenantUserMap');
const createHttpError = require('http-errors');
const { ERROR_MESSAGE, STATUS_CODE } = require('../../utils/constant');
const resendForgotPasswordOtpEmail = require('../../utils/emails/resendForgotPasswordOtp');
const getTenantModel = require('../../utils/getTenantModel');
const userSchema = require('../../models/tenant/userSchema');
const TIME = require('../../utils/times.js');
const redis = require('../../services/cache.js');

module.exports = async function (email) {
    const normalizedEmail = email.trim().toLowerCase();
    const tenant = await TenantUserMap.findOne({ email: normalizedEmail }).populate("tenantId", "slug dbName orgName");
    if (!tenant) throw new createHttpError(STATUS_CODE.UNPROCESSABLE_ENTITY, ERROR_MESSAGE.INVALID_CREDENTIALS);

    const User = getTenantModel(tenant.tenantId.dbName, 'User', userSchema);

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) throw new createHttpError(STATUS_CODE.UNPROCESSABLE_ENTITY, ERROR_MESSAGE.INVALID_CREDENTIALS);

    const resendKey = `otp_resend_blocked:${tenant.tenantId.slug}:${user._id}`;
    const isBlocked = await redis.exists(resendKey);
    if (isBlocked) {
        throw new createHttpError(STATUS_CODE.UNPROCESSABLE_ENTITY, ERROR_MESSAGE.OTP_RESEND_LIMIT);
    }
    const { otp, expiryTime } = await user.generateOTP(tenant.tenantId.slug);
    await redis.set(resendKey, '1', 'PX', TIME.OTP_RESEND_BLOCK_UNTIL);

    try {
        await resendForgotPasswordOtpEmail(tenant.tenantId.orgName, user.firstName, user.lastName, otp, user.email);
    } catch (error) {
        console.error(error);
        await redis.del(resendKey);
        throw createHttpError(STATUS_CODE.INTERNAL_SERVER_ERROR, ERROR_MESSAGE.EMAIL_SEND_FAILED);
    }
    await user.save({ validateBeforeSave: false });
    return expiryTime;
}