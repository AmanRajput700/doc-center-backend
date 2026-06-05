const notificationPreferenceSchema = require('../../models/tenant/notificationPreferenceSchema');
const DEFAULT_NOTIFICATION_PREFERENCES = require('../../utils/defaultNotificationPreferences');
const mongoose = require('mongoose');

module.exports = async function (dbName, userId, tenantId) {

    const tenantDB = mongoose.connection.useDb(dbName);

    const NotificationPreference =
        tenantDB.models.NotificationPreference ||
        tenantDB.model('NotificationPreference', notificationPreferenceSchema);

    const exists = await NotificationPreference.findOne({
        userId,
        tenantId
    }).lean();

    if (exists) return exists;

    return NotificationPreference.create({
        userId,
        tenantId,
        ...DEFAULT_NOTIFICATION_PREFERENCES
    });
};