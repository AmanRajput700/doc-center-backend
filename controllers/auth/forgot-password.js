const TenantUserMap = require('../../models/root/TenantUserMap');
const createHttpError = require('http-errors');
const { ERROR_MESSAGE, STATUS_CODE } = require('../../utils/constant');
const forgotPasswordOtpEmail = require('../../utils/emails/forgotPasswordOtp');
const userSchema = require('../../models/tenant/userSchema');
const jwt = require('jsonwebtoken');
const getTenantModel = require('../../utils/getTenantModel');

module.exports = async function (userData) {
    const { email, slug } = userData;
    const normalizedEmail = email.trim().toLowerCase();
    const tenant = await TenantUserMap.findOne({ email: normalizedEmail }).populate("tenantId", "slug dbName orgName");
    if (!tenant || tenant.tenantId.slug !== slug) throw new createHttpError(STATUS_CODE.UNPROCESSABLE_ENTITY, ERROR_MESSAGE.INVALID_CREDENTIALS);

    const User = getTenantModel(tenant.tenantId.dbName, 'User', userSchema);

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) throw new createHttpError(STATUS_CODE.UNPROCESSABLE_ENTITY, ERROR_MESSAGE.INVALID_CREDENTIALS);
    const otp = user.generateOTP();
    const emailVerifyToken = jwt.sign({ email }, process.env.JWT_EMAIL_VERIFY_SECRET, { expiresIn: process.env.JWT_EMAIL_VERIFY_EXPIRY });
    try {
        await forgotPasswordOtpEmail(tenant.tenantId.orgName, user.firstName, user.lastName, otp, user.email);
    } catch (error) {
        console.error(error);
    }
    await user.save({ validateBeforeSave: false });
    return emailVerifyToken;
}