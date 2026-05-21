const mongoose = require('mongoose');
const roleSchema = require('../../models/tenant/roleSchema');
const userSchema = require('../../models/tenant/userSchema');
const redis = require('../../services/cache');
const createHttpError = require('http-errors');
const { STATUS_CODE, ERROR_MESSAGE } = require('../../utils/constant');

module.exports = async function (roleId, dbName) {
    const tenantDB = mongoose.connection.useDb(dbName);

    const Role = tenantDB.models.Role || tenantDB.model('Role', roleSchema);
    const User = tenantDB.models.User || tenantDB.model('User', userSchema);

    const role = await Role.findById(roleId);
    if (!role) throw new createHttpError(STATUS_CODE.NOT_FOUND, ERROR_MESSAGE.ROLE_NOT_FOUND);

    const userCount = await User.countDocuments({ role: roleId });
    if (userCount > 0) throw new createHttpError(STATUS_CODE.CONFLICT, 'Cannot delete role assigned to users');

    const deletedRole = await Role.findByIdAndDelete(roleId);

    await redis.del(`roles:${dbName}`);
    return deletedRole;
}