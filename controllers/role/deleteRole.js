const mongoose = require('mongoose');
const roleSchema = require('../../models/tenant/roleSchema');
const redis = require('../../services/cache');
const createHttpError = require('http-errors');
const { STATUS_CODE, ERROR_MESSAGE } = require('../../utils/constant');

module.exports = async function (roleId, dbName) {
    const tenantDB = mongoose.connection.useDb(dbName);

    const Role = tenantDB.models.Role || tenantDB.model('Role', roleSchema);

    const deletedRole = await Role.findByIdAndDelete(roleId);

    await redis.del(`role:${dbName}`);
    return deletedRole;
}