const userSchema = require('../../models/tenant/userSchema');
const { STATUS_CODE, ERROR_MESSAGE } = require('../../utils/constant');
const createHttpError = require('http-errors');
const getTenantModel = require('../../utils/getTenantModel');
const notificationPreferenceSchema = require('../../models/tenant/notificationPreferenceSchema');
const securityAlertEmail = require('../../utils/emails/securityAlertsEmail');
const { addEmailJob } = require('../../queues/producers/emailProducers');

module.exports = async function (data, userId, tenant) {
    const { dbName, _id: tenantId } = tenant;
    const { currentPassword, newPassword, confirmPassword } = data;

    if (newPassword !== confirmPassword) throw new createHttpError(STATUS_CODE.CONFLICT, ERROR_MESSAGE.PASSWORD_MISMATCH);

    const User = getTenantModel(dbName, 'User', userSchema);
    const NotificationPreference = getTenantModel(dbName, 'NotificationPreference', notificationPreferenceSchema);

    const user = await User.findById(userId).select('+password');
    if (!user) throw new createHttpError(STATUS_CODE.NOT_FOUND, ERROR_MESSAGE.USER_NOT_FOUND);

    const isValidUser = await user.comparePassword(currentPassword);
    if (!isValidUser) throw new createHttpError(STATUS_CODE.UNAUTHORIZED, 'Wrong Current Password');

    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) throw new createHttpError(STATUS_CODE.CONFLICT, 'New password is same as Old password');

    const notification = await NotificationPreference.findOne({ userId, tenantId }).lean();

    if (notification.emailNotifications.securityAlerts) {
        const alertData = {
            orgName: tenant.orgName, firstName: user.firstName, lastName: user.lastName, email: user.email, alertTitle: "Password Changed Successfully", alertType: "Password Change", alertMessage: "Your account password was changed successfully.", performedBy: `${user.firstName}  ${user.lastName}`, eventDate: new Date().toLocaleString(),
            details: [
                {
                    label: 'Email',
                    value: user.email
                }
            ]
        };
        await addEmailJob('security-alert', alertData);
    }

    user.password = newPassword;
    await user.save();
    return;
}