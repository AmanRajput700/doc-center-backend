const createHttpError = require('http-errors');
const Tenant = require('../../models/root/Tenant');
const { ERROR_MESSAGE, STATUS_CODE } = require('../../utils/constant');
const tenantVerifyEmail = require('../../utils/emails/verifyTenant');
const crypto = require('node:crypto');

module.exports = async function (expiredToken) {
    const hashedToken = crypto.createHash('sha256').update(expiredToken.trim()).digest('hex');
    const tenant = await Tenant.findOne({ setPasswordToken: hashedToken });
    if (!tenant) throw new createHttpError(STATUS_CODE.NOT_FOUND, ERROR_MESSAGE.TENANT_NOT_FOUND);

    if (tenant.setPasswordExpiry > Date.now()) throw new createHttpError(STATUS_CODE.BAD_REQUEST, 'Token is still valid');

    const token = tenant.generateSetPasswordToken();
    await tenant.save();
    const verificationLink = `${process.env.FRONTEND_URL}/onboarding/activate?token=${token}`;
    await tenantVerifyEmail(tenant.orgName, tenant.applicant.firstName, tenant.applicant.lastName, tenant.applicant.email, verificationLink);
};