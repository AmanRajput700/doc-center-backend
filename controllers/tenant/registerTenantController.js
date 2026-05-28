const jwt = require('jsonwebtoken');
const createHttpError = require('http-errors');
const Tenant = require('../../models/root/Tenant');
const { ERROR_MESSAGE, STATUS_CODE } = require('../../utils/constant');
const tenantVerifyEmail = require('../../utils/emails/verifyTenant');

module.exports = async function (tenantData) {
    const { orgName, orgSlogan, slug, logoKey, firstName, lastName, email } = tenantData;

    const isTenantOrgNameExists = await Tenant.findOne({ orgName });
    if (isTenantOrgNameExists) throw new createHttpError(STATUS_CODE.CONFLICT, ERROR_MESSAGE.INVALID_ORGNAME);

    const isTenantSlugExists = await Tenant.findOne({ slug });
    if (isTenantSlugExists) throw new createHttpError(STATUS_CODE.CONFLICT, ERROR_MESSAGE.INVALID_SLUG);

    const dbName = `db_${slug}`;
    const applicant = { firstName, lastName, email };

    let tenant;
    try {
        tenant = await Tenant.create({
            orgName, orgSlogan, slug, logo: logoKey, applicant, dbName
        });
    } catch (error) {
        if (error.status = 11000) throw new createHttpError(STATUS_CODE.CONFLICT, ERROR_MESSAGE.EMAIL_ALREAY_EXISTS);
    }

    const token = tenant.generateSetPasswordToken();
    const verificationLink = `${process.env.FRONTEND_URL}/onboarding/activate?token=${token}`;
    await tenantVerifyEmail(orgName, firstName, lastName, email, verificationLink);
    await tenant.save();
    return { orgName, orgSlogan, slug, firstName, lastName, email };
};