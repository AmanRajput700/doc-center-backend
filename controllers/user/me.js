const userSchema = require('../../models/tenant/userSchema');
const roleSchema = require('../../models/tenant/roleSchema');
const permissionSchema = require('../../models/tenant/permissionSchema');
const mongoose = require('mongoose');
const createHttpError = require('http-errors');
const { STATUS_CODE, ERROR_MESSAGE } = require('../../utils/constant');

module.exports = async function (userId, dbName) {
    const tenantDB = mongoose.connection.useDb(dbName);
    const User = tenantDB.models.User || tenantDB.model('User', userSchema);
    const Role = tenantDB.models.Role || tenantDB.model('Role', roleSchema);
    const Permission = tenantDB.models.Permission || tenantDB.model('Permission', permissionSchema);

    const user = await User.findById(userId)
        .populate({
            path: 'role',
            populate: {
                path: 'permissions',
                select: 'name module'
            }
        })
        .select('-password -failedLogInAttempts -updatedAt -otpAttempts ')
        .lean();

    if (user.role && user.role.permissions) {
        user.role.permissions = user.role.permissions.map((permission) => {
            return permission.name;
        });
    }

    if (!user) throw new createHttpError(STATUS_CODE.NOT_FOUND, ERROR_MESSAGE.USER_NOT_FOUND);

    return user;
}