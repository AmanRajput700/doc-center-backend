const userSchema = require('../../models/tenant/userSchema');
const { STATUS_CODE, ERROR_MESSAGE } = require('../../utils/constant');
const createHttpError = require('http-errors');
const getTenantModel = require('../../utils/getTenantModel');
const redis = require('../../services/cache');
const TenantUserMap = require('../../models/root/TenantUserMap');
const inviteMemberSchema = require('../../models/tenant/inviteMemberSchema');
const roleSchema = require('../../models/tenant/roleSchema');
const notificationPreferenceSchema = require('../../models/tenant/notificationPreferenceSchema');
const securityAlertEmail = require('../../utils/emails/securityAlertsEmail');
const mongoose = require('mongoose')

module.exports = async function (userId, tenant, adminUser) {
    const { dbName, _id: tenantId } = tenant;
    const User = getTenantModel(dbName, 'User', userSchema);
    const InviteMember = getTenantModel(dbName, 'InviteMember', inviteMemberSchema);
    const Role = getTenantModel(dbName, 'Role', roleSchema);
    const NotificationPreference = getTenantModel(dbName, 'NotificationPreference', notificationPreferenceSchema);

    const allRoles = await Role.find({});

    const adminRole = await Role.findOne({ name: "Admin" });
    if (!adminRole) throw new createHttpError(STATUS_CODE.NOT_FOUND, "Admin role configuration not found for this tenant.");
    const deletedUser = await User.findOneAndDelete({ _id: userId, role: { $ne: adminRole._id } });
    if (!deletedUser) throw new createHttpError(STATUS_CODE.NOT_FOUND, ERROR_MESSAGE.USER_NOT_FOUND);
    await TenantUserMap.deleteOne({ email: deletedUser.email });
    await InviteMember.deleteOne({ email: deletedUser.email });
    const preferences = await NotificationPreference.findOne({ userId, tenantId, 'emailNotifications.securityAlerts': true });
    if (preferences) {
        const alertData = {
            orgName: tenant.orgName,
            firstName: deletedUser.firstName,
            lastName: deletedUser.lastName,
            email: deletedUser.email,

            alertTitle: 'User Deleted',
            alertType: 'User Deleted',

            alertMessage: `User Account Deleted`,

            performedBy: `${adminUser.firstName} ${adminUser.lastName}`,

            eventDate: new Date().toLocaleString(),

            details: [
                {
                    label: 'Deleted User Email',
                    value: deletedUser.email
                }
            ]
        };

        await securityAlertEmail(alertData);
    }
    await redis.del(`user:${dbName}`);
    return deletedUser;
}