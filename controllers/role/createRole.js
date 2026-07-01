const getTenantModel = require('../../utils/getTenantModel');
const roleSchema = require('../../models/tenant/roleSchema');
const redis = require('../../services/cache');
const createHttpError = require('http-errors');
const { STATUS_CODE, ERROR_MESSAGE } = require('../../utils/constant');

module.exports = async function (roleData, dbName) {
    const { name, description } = roleData;

    const Role = getTenantModel(dbName, 'Role', roleSchema);

    const isRoleExists = await Role.findOne({ name });
    if (isRoleExists) throw new createHttpError(STATUS_CODE.CONFLICT, ERROR_MESSAGE.ROLE_ALREADY_EXISTS);

    const role = await Role.create({ name, description });
    await redis.del(`roles:${dbName}`);
    return role;
}