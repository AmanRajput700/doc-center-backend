const userSchema = require('../../models/tenant/userSchema');
const roleSchema = require('../../models/tenant/roleSchema');
const getTenantModel = require('../../utils/getTenantModel');
const createHttpError = require('http-errors');
const { STATUS_CODE, ERROR_MESSAGE } = require('../../utils/constant');
const redis = require('../../services/cache');
const notificationPreferenceSchema = require('../../models/tenant/notificationPreferenceSchema');
const securityAlertEmail = require('../../utils/emails/securityAlertsEmail');
const { addEmailJob } = require('../../queues/producers/emailProducers');
const { NOTIFICATION_RECEIVED } = require('../../socket/constants/events');
const { createNotification } = require('../../services/notificationService');


module.exports = async function (userId, roleId, tenant, adminUser) {
    const { dbName, _id: tenantId } = tenant;
    const User = getTenantModel(dbName, 'User', userSchema);
    const NotificationPreference = getTenantModel(
        dbName,
        'NotificationPreference',
        notificationPreferenceSchema
    );


    const user = await User.findByIdAndUpdate(userId, { role: roleId }, { returnDocument: 'after' }).populate('role', 'name').select('-password -refreshToken -failedLogInAttempts');
    console.log("🚀 ~ user:", user)

    if (!user) throw new createHttpError(STATUS_CODE.NOT_FOUND, ERROR_MESSAGE.USER_NOT_FOUND);

    const roleName = user.role ? user.role.name : 'Unknown Role';

    const preferences = await NotificationPreference.findOne({ userId, tenantId, 'emailNotifications.securityAlerts': true });
    if (preferences) {
        const alertData = {
            orgName: tenant.orgName,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,

            alertTitle: 'Role Updated',
            alertType: 'Role Updated',

            alertMessage: `New Assigned Role (${roleName})`,

            performedBy: `${adminUser.firstName} ${adminUser.lastName}`,

            eventDate: new Date().toLocaleString(),

            details: [
                {
                    label: 'Assigned Role',
                    value: roleName
                }
            ]
        };

        await addEmailJob('security-alert', alertData);
    }

    const notificationData = {
        tenant,
        userId: user._id,
        title: 'Role Changed',
        message: `Your role has been changed to ${roleName}`
    }
    await createNotification(notificationData);

    await redis.del(`user:${dbName}`);
    return user;
}