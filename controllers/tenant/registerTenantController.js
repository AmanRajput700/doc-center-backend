const jwt = require('jsonwebtoken');
const createHttpError = require('http-errors');
const Tenant = require('../../models/root/Tenant');
const ERROR_MESSAGE = require('../../utils/constant');
const tenantVerifyEmail = require('../../utils/emails/verifyTenant');

module.exports = async function (tenantData) {
    const { orgName, orgSlogan, slug, logo, firstName, lastName, email } = tenantData;

    const isTenantExists = await Tenant.findOne({ slug });
    if (isTenantExists) throw new createHttpError(createHttpError.Conflict, ERROR_MESSAGE.TENANT_ALREADY_EXISTS);

    const dbName = `db_${slug}`;
    const applicant = { firstName, lastName, email };

    const tenant = await Tenant.create({
        orgName, orgSlogan, slug, logo, applicant, dbName
    });

    const token = tenant.generateSetPasswordToken();
    console.log(token);
    await tenant.save();
    const verificationLink = `${process.env.FRONTEND_URL}/onboarding/activate?token=${token}`;
    await tenantVerifyEmail(orgName, firstName, lastName, email, verificationLink);
    return tenant;
};