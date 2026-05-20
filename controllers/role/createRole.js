const mongoose = require('mongoose');
const roleSchema = require('../../models/tenant/roleSchema');
const redis = require('../../services/cache');
const createHttpError = require('http-errors');
const { STATUS_CODE, ERROR_MESSAGE } = require('../../utils/constant');

module.exports = async function (roleData, dbName) {
    const { name } = roleData;

    const tenantDB = mongoose.connection.useDb(dbName);
    const Role = tenantDB.models.Role || tenantDB.model('Role', roleSchema);

    const isRoleExists = await Role.findOne({ name });
    if (isRoleExists) throw new createHttpError(STATUS_CODE.CONFLICT, ERROR_MESSAGE.ROLE_ALREADY_EXISTS);

    const role = await Role.create({ name });
    await redis.del(`roles:${dbName}`);
    return role;
}