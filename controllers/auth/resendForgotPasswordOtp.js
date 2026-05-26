const TenantUserMap = require('../../models/root/TenantUserMap');
const createHttpError = require('http-errors');
const { ERROR_MESSAGE, STATUS_CODE } = require('../../utils/constant');
const resendForgotPasswordOtpEmail = require('../../utils/emails/resendForgotPasswordOtp');
const getTenantModel = require('../../utils/getTenantModel');
const userSchema = require('../../models/tenant/userSchema');
const TIME = require('../../utils/times.js')

module.exports = async function (email) {
    const normalizedEmail = email.trim().toLowerCase();
    const tenant = await TenantUserMap.findOne({ email: normalizedEmail }).populate("tenantId", "slug dbName orgName");
    if (!tenant) throw new createHttpError(STATUS_CODE.UNPROCESSABLE_ENTITY, ERROR_MESSAGE.INVALID_CREDENTIALS);

    const User = getTenantModel(tenant.tenantId.dbName, 'User', userSchema);

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) throw new createHttpError(STATUS_CODE.UNPROCESSABLE_ENTITY, ERROR_MESSAGE.INVALID_CREDENTIALS);
    if (user.otpResendBlockedUntil && user.otpResendBlockedUntil > Date.now()) {
        throw new createHttpError(STATUS_CODE.UNPROCESSABLE_ENTITY, ERROR_MESSAGE.OTP_RESEND_LIMIT);
    }
    const otp = user.generateOTP();
    user.otpResendBlockedUntil = Date.now() + TIME.OTP_RESEND_BLOCK_UNTIL;
    try {
        await resendForgotPasswordOtpEmail(tenant.tenantId.orgName, user.firstName, user.lastName, otp, user.email);
    } catch (error) {
        console.error(error)
    }
    await user.save({ validateBeforeSave: false });
}