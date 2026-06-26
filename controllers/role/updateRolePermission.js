const getTenantModel = require('../../utils/getTenantModel');
const roleSchema = require('../../models/tenant/roleSchema');
const permissionSchema = require('../../models/tenant/permissionSchema');
const userSchema = require('../../models/tenant/userSchema');
const notificationPreferenceSchema = require('../../models/tenant/notificationPreferenceSchema');
const redis = require('../../services/cache');
const createHttpError = require('http-errors');
const { STATUS_CODE, ERROR_MESSAGE } = require('../../utils/constant');
const securityAlertEmail = require('../../utils/emails/securityAlertsEmail');
const { addEmailJob } = require('../../queues/producers/emailProducers');

module.exports = async function (roleId, userId, permissionData, tenant) {
    const { dbName, _id: tenantId } = tenant;
    const { permissionIds } = permissionData;

    if (!Array.isArray(permissionIds)) {
        throw new createHttpError(
            STATUS_CODE.BAD_REQUEST,
            'Permissions must be an array'
        );
    }

    const Role = getTenantModel(dbName, 'Role', roleSchema);
    const Permission = getTenantModel(dbName, 'Permission', permissionSchema);
    const User = getTenantModel(dbName, 'User', userSchema);
    const NotificationPreference = getTenantModel(
        dbName,
        'NotificationPreference',
        notificationPreferenceSchema
    );

    const adminUser = await User.findById(userId).lean();
    if (!adminUser) throw new createHttpError(STATUS_CODE.NOT_FOUND, ERROR_MESSAGE.USER_NOT_FOUND);
    if (adminUser.role.toString() === roleId.toString()) throw new createHttpError(STATUS_CODE.BAD_REQUEST, 'User cannot modify their own role permissions');

    const roleExists = await Role.findById(roleId).lean();
    if (!roleExists) throw new createHttpError(STATUS_CODE.NOT_FOUND, ERROR_MESSAGE.ROLE_NOT_FOUND);

    const permissionExists = await Permission.find({ _id: { $in: permissionIds } }).lean();
    if (permissionIds.length !== permissionExists.length) throw new createHttpError(STATUS_CODE.NOT_FOUND, ERROR_MESSAGE.PERMISSION_NOT_FOUND);


    // Calculate permission differences
    const oldPermissionIds = roleExists.permissions.map(id =>
        id.toString()
    );

    const addedPermissions = permissionExists.filter(
        permission =>
            !oldPermissionIds.includes(permission._id.toString())
    );

    const removedPermissionIds = oldPermissionIds.filter(
        id => !permissionIds.includes(id)
    );

    const removedPermissions = await Permission.find({
        _id: { $in: removedPermissionIds }
    }).lean();

    // Update role
    const updatedRole = await Role.findByIdAndUpdate(
        roleId,
        {
            permissions: permissionIds
        },
        {
            new: true
        }
    );

    // Clear cache
    await redis.del(`roles:${dbName}`);

    // Get all users under this role
    const roleUsers = await User.find({ role: roleId }).lean();
    if (!roleUsers.length) return updatedRole;

    // Get notification preferences
    const userIds = roleUsers.map(user => user._id);

    const notificationPreferences = await NotificationPreference.find({
        tenantId,
        userId: { $in: userIds },
        'emailNotifications.securityAlerts': true
    }).lean();

    const allowedUserIds = new Set(
        notificationPreferences.map(pref =>
            pref.userId.toString()
        )
    );

    const addedPermissionsText =
        addedPermissions.length > 0
            ? addedPermissions.map(p => p.displayName).join(', ')
            : 'None';

    const removedPermissionsText =
        removedPermissions.length > 0
            ? removedPermissions.map(p => p.displayName).join(', ')
            : 'None';


    // Send emails
     await Promise.all(
        roleUsers
            .filter(user =>
                allowedUserIds.has(user._id.toString())
            )
            .map(user => {
                const alertData = {
                    orgName: tenant.orgName,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,

                    alertTitle: 'Role Permissions Updated',
                    alertType: 'Permission Change',

                    alertMessage: `Permissions assigned to your role (${roleExists.name}) have been updated.`,

                    performedBy: `${adminUser.firstName} ${adminUser.lastName}`,

                    eventDate: new Date().toLocaleString(),

                    details: [
                        {
                            label: 'Role',
                            value: roleExists.name
                        },
                        {
                            label: 'Added Permissions',
                            value: addedPermissionsText
                        },
                        {
                            label: 'Removed Permissions',
                            value: removedPermissionsText
                        }
                    ]
                };

                // return securityAlertEmail(alertData);
                return addEmailJob('security-alert',alertData);
            })
    );

    return updatedRole;
};