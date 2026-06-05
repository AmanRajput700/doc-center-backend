const createHttpError = require('http-errors');
const Tenant = require('../../models/root/Tenant');
const { ERROR_MESSAGE, STATUS_CODE } = require('../../utils/constant');
const crypto = require('node:crypto');
const userSchema = require('../../models/tenant/userSchema');
const mongoose = require('mongoose');
const TenantUserMap = require('../../models/root/TenantUserMap');
const permissionSeeder = require('../../seeders/tenant/permissionSeeder');
const roleSeeder = require('../../seeders/tenant/roleSeeder');
const getTenantModel = require('../../utils/getTenantModel');
const storageSchema = require('../../models/tenant/storageSchema');
const notificationPreferenceSeeder = require('../../seeders/tenant/notificationPrefrenceSeeder');

module.exports = async function (userData) {
    const { password, confirmPassword, token } = userData;
    if (password !== confirmPassword) throw new createHttpError(STATUS_CODE.UNAUTHORIZED, ERROR_MESSAGE.INVALID_CREDENTIALS);
    const hashedSetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');

    const tenant = await Tenant.findOne({ setPasswordToken: hashedSetPasswordToken, setPasswordExpiry: { $gt: Date.now() } });
    if (!tenant) throw new createHttpError(STATUS_CODE.BAD_REQUEST, "Password already set ");

    const tenantDB = mongoose.connection.useDb(tenant.dbName);
    const User = getTenantModel(tenant.dbName, 'User', userSchema);
    const Storage = getTenantModel(tenant.dbName, 'Storage', storageSchema);
    await permissionSeeder(tenantDB);
    const role = await roleSeeder(tenantDB);
    await Storage.create({ tenantId: tenant._id });
    const user = await User.create({
        firstName: tenant.applicant.firstName,
        lastName: tenant.applicant.lastName,
        email: tenant.applicant.email,
        password,
        role: role._id,
        status: 'active',
    });

    await notificationPreferenceSeeder(tenant.dbName, user._id, tenant._id);

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