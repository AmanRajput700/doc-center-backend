const getTenantModel = require('../../utils/getTenantModel');
const notificationSchema = require('../../models/tenant/notificationSchema');

module.exports = async function (tenant, user) {
    const { _id: tenantId, dbName } = tenant;
    const { _id: userId } = user;
    const Notification = getTenantModel(dbName, "Notification", notificationSchema);

    const notification = await Notification.find({ userId }).sort({ createdAt: -1 });
    const unreadCount = await Notification.countDocuments({ userId, isRead: false });
    return { notification, unreadCount };
};