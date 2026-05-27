const getTenantModel = require('../../utils/getTenantModel');
const roleSchema = require('../../models/tenant/roleSchema');
const redis = require('../../services/cache');
const createHttpError = require('http-errors');
const { STATUS_CODE, ERROR_MESSAGE } = require('../../utils/constant');

module.exports = async function (roleId, roleData, dbName) {
    const { name, description } = roleData;

    const Role = getTenantModel(dbName, 'Role', roleSchema);
    const roleExists = await Role.findById(roleId);
    if (!roleExists) throw new createHttpError(STATUS_CODE.NOT_FOUND, ERROR_MESSAGE.ROLE_NOT_FOUND);

    const duplicateRole = await Role.findOne({
        name: name.trim(),
        _id: { $ne: roleId }
    });

    if (duplicateRole) {
        throw new createHttpError(STATUS_CODE.CONFLICT, ERROR_MESSAGE.ROLE_ALREADY_EXISTS);
    }

    const updatedRole = await Role.findByIdAndUpdate(roleId, { name, description }, {returnDocument: 'after'});
    await redis.del(`roles:${dbName}`);
    return updatedRole;
}