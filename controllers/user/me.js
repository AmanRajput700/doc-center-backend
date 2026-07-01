const userSchema = require('../../models/tenant/userSchema');
const roleSchema = require('../../models/tenant/roleSchema');
const permissionSchema = require('../../models/tenant/permissionSchema');
const getTenantModel = require('../../utils/getTenantModel');
const createHttpError = require('http-errors');
const { STATUS_CODE, ERROR_MESSAGE } = require('../../utils/constant');
const notificationPreferenceSchema = require('../../models/tenant/notificationPreferenceSchema');
const notificationPrefrenceSeeder = require('../../seeders/tenant/notificationPrefrenceSeeder');

module.exports = async function (userId, tenant) {
    const { dbName, _id: tenantId } = tenant;
    const User = getTenantModel(dbName, 'User', userSchema);
    const Role = getTenantModel(dbName, 'Role', roleSchema);
    const Permission = getTenantModel(dbName, 'Permission', permissionSchema);
    const NotificationPreference = getTenantModel(dbName, 'NotificationPreference', notificationPreferenceSchema);


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
    const userNotificationPreferences = await NotificationPreference.findOne({ userId, tenantId });

    return {  user, userNotificationPreferences };
}