const getTenantModel = require('../../utils/getTenantModel');
const notificationPreferenceSchema = require('../../models/tenant/notificationPreferenceSchema');

module.exports = async function updateNotificationPreferences(notificationPrefData, user, tenant) {
    const { _id: tenantId, dbName } = tenant;
    const { _id: userId } = user;

    const NotificationPreferences = getTenantModel(dbName, 'NotificationPreferences', notificationPreferenceSchema);
    const updated = await NotificationPreferences.findOneAndUpdate(
        {
            userId, tenantId
        },
        {
            $set: notificationPrefData
        },
        {
            new: true,
            upsert: true
        }
    );
    return updated;
};