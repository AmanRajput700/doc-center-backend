const mongoose = require('mongoose');
const roleSchema = require('../../models/tenant/roleSchema');
const redis = require('../../services/cache');
const createHttpError = require('http-errors');
const { STATUS_CODE, ERROR_MESSAGE } = require('../../utils/constant');

module.exports = async function (roleId, roleData, dbName) {
    const { name } = roleData;
    const tenantDB = mongoose.connection.useDb(dbName);

    const Role = tenantDB.models.Role || tenantDB.model('Role', roleSchema);
    const roleExists = await Role.findById(roleId);
    if (!roleExists) throw new createHttpError(STATUS_CODE.NOT_FOUND, ERROR_MESSAGE.ROLE_NOT_FOUND);

    const duplicateRole = await Role.findOne({
        name: name.trim(),
        _id: { $ne: roleId }
    });

    if (duplicateRole) {
        throw new createHttpError(STATUS_CODE.CONFLICT, ERROR_MESSAGE.ROLE_ALREADY_EXISTS);
    }

    const updatedRole = await Role.findByIdAndUpdate(roleId, { name });
    await redis.del(`roles:${dbName}`);
    return updatedRole;
}