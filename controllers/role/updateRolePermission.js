const getTenantModel = require('../../utils/getTenantModel');
const roleSchema = require('../../models/tenant/roleSchema');
const permissionSchema = require('../../models/tenant/permissionSchema');
const userSchema = require('../../models/tenant/userSchema');
const redis = require('../../services/cache');
const createHttpError = require('http-errors');
const { STATUS_CODE, ERROR_MESSAGE } = require('../../utils/constant');

module.exports = async function (roleId, userId, permissionData, dbName) {

    const { permissionIds } = permissionData;
    if (!Array.isArray(permissionIds)) {
        throw new createHttpError(STATUS_CODE.BAD_REQUEST, 'Permissions must be an array');
    }

    const Role = getTenantModel(dbName, 'Role', roleSchema);
    const Permission = getTenantModel(dbName, 'Permission', permissionSchema);
    const User = getTenantModel(dbName, 'User', userSchema);

    const user = await User.findById(userId);
    if (!user) throw new createHttpError(STATUS_CODE.NOT_FOUND, ERROR_MESSAGE.USER_NOT_FOUND);
    if (user.role.toString() === roleId.toString()) throw new createHttpError(STATUS_CODE.BAD_REQUEST, 'User cannot modify their own role permissions')

    const roleExists = await Role.findById(roleId);
    if (!roleExists) throw new createHttpError(STATUS_CODE.NOT_FOUND, ERROR_MESSAGE.ROLE_NOT_FOUND);

    const permissionExists = await Permission.find({ _id: { $in: permissionIds } });
    if (permissionIds.length !== permissionExists.length) throw new createHttpError(STATUS_CODE.NOT_FOUND, ERROR_MESSAGE.PERMISSION_NOT_FOUND);

    const updatedRole = await Role.findByIdAndUpdate(roleId, { permissions: permissionIds }, { returnDocument: 'after' });
    await redis.del(`roles:${dbName}`);
    return updatedRole;
}