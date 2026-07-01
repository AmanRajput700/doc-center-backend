const TenantUserMap = require('../../models/root/TenantUserMap');
const createHttpError = require('http-errors');
const { ERROR_MESSAGE, STATUS_CODE } = require('../../utils/constant');
const forgotPasswordOtpEmail = require('../../utils/emails/forgotPasswordOtp');
const userSchema = require('../../models/tenant/userSchema');
const getTenantModel = require('../../utils/getTenantModel');

module.exports = async function (userData) {
    const { email, slug } = userData;
    const normalizedEmail = email.trim().toLowerCase();
    const tenant = await TenantUserMap.findOne({ email: normalizedEmail }).populate("tenantId", "slug dbName orgName");
    if (!tenant || tenant.tenantId.slug !== slug) throw new createHttpError(STATUS_CODE.UNPROCESSABLE_ENTITY, ERROR_MESSAGE.INVALID_CREDENTIALS);

    const User = getTenantModel(tenant.tenantId.dbName, 'User', userSchema);

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) throw new createHttpError(STATUS_CODE.UNPROCESSABLE_ENTITY, ERROR_MESSAGE.INVALID_CREDENTIALS);
    const { otp, expiryTime } = await user.generateOTP(slug);
    try {
        await forgotPasswordOtpEmail(tenant.tenantId.orgName, user.firstName, user.lastName, otp, user.email);
    } catch (error) {
        console.error(error);
        throw createHttpError(STATUS_CODE.INTERNAL_SERVER_ERROR, ERROR_MESSAGE.EMAIL_SEND_FAILED);
    }
    return expiryTime;
}