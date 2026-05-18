const createHttpError = require('http-errors');
const Tenant = require('../../models/root/Tenant');
const { ERROR_MESSAGE, STATUS_CODE } = require('../../utils/constant');
const crypto = require('node:crypto');
const userSchema = require('../../models/tenant/userSchema');
const mongoose = require('mongoose');
const TenantUserMap = require('../../models/root/TenantUserMap');
const permissionSeeder = require('../../seeders/tenant/permissionSeeder');
const roleSeeder = require('../../seeders/tenant/roleSeeder');

module.exports = async function (userData) {
    const { password, confirmPassword, token } = userData;
    if (password !== confirmPassword) throw new createHttpError(STATUS_CODE.UNAUTHORIZED, ERROR_MESSAGE.INVALID_CREDENTIALS);
    const hashedSetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');

    const tenant = await Tenant.findOne({ setPasswordToken: hashedSetPasswordToken, setPasswordExpiry: { $gt: Date.now() } });
    if (!tenant) throw new createHttpError(STATUS_CODE.UNAUTHORIZED, ERROR_MESSAGE.INVALID_CREDENTIALS);

    const tenantDB = mongoose.connection.useDb(tenant.dbName);
    const User = tenantDB.models.User || tenantDB.model('User', userSchema);
    const roleId = await roleSeeder(tenantDB);
    await User.create({
        firstName: tenant.applicant.firstName,
        lastName: tenant.applicant.lastName,
        email: tenant.applicant.email,
        password,
        role: roleId,
        status: 'active',
    });

    await permissionSeeder(tenantDB);
    await TenantUserMap.create({
        email: tenant.applicant.email,
        tenantId: tenant._id,
        status: 'active'
    });

    tenant.status = 'active';
    tenant.setPasswordToken = undefined;
    tenant.setPasswordExpiry = undefined;
    await tenant.save();

    return tenant;
};