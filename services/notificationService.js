const getTenantModel = require('../utils/getTenantModel');
const notificationSchema = require('../models/tenant/notificationSchema');
const { emitToUser } = require('../socket/services/emitService');
const EVENTS = require('../socket/constants/events');
const createHttpError = require('http-errors');
const { STATUS_CODE, ERROR_MESSAGE } = require('../utils/constant');

async function createNotification({ tenant, userId, title, message, type, metadata = {}, createdBy = null }) {
    const Notification = getTenantModel(tenant.dbName, 'Notification', notificationSchema);

    const notification =
        await Notification.create({
            userId,
            title,
            message,
            type,
            metadata,
            createdBy
        });

    emitToUser(userId, EVENTS.NOTIFICATION_RECEIVED, notification);

    const unreadCount = await getUnreadCount({ tenant, userId });

    emitToUser(
        userId,
        EVENTS.NOTIFICATION_UNREAD_COUNT,
        {
            count: unreadCount
        }
    );

    return notification;
}

async function createBulkNotifications({ tenant, userIds, title, message, type, metadata = {}, createdBy = null }) {
    const Notification = getTenantModel(tenant.dbName, 'Notification', notificationSchema);

    const notifications = userIds.map(userId => ({
        userId,
        title,
        message,
        type,
        metadata,
        createdBy
    }));

    const createdNotifications = await Notification.insertMany(notifications);


    for (const notification of createdNotifications) {

        emitToUser(
            notification.userId,
            EVENTS.NOTIFICATION_RECEIVED,
            notification
        );

        const unreadCount = await getUnreadCount({ tenant, userId: notification.userId });

        emitToUser(
            notification.userId,
            EVENTS.NOTIFICATION_UNREAD_COUNT,
            {
                count: unreadCount
            }
        );
    }

    return createdNotifications;
}

async function markAsRead({ tenant, notificationId, userId }) {

    const Notification = getTenantModel(tenant.dbName, 'Notification', notificationSchema);

    const notification = await Notification.findOneAndUpdate(
        {
            _id: notificationId,
            userId,
            isRead: false
        },
        {
            isRead: true,
            readAt: new Date()
        },
        {
            new: true
        }
    );

    if (!notification) throw createHttpError(STATUS_CODE.NOT_FOUND, ERROR_MESSAGE.NOT_FOUND);

    emitToUser(userId, EVENTS.NOTIFICATION_READ, {
        notificationId: notification._id
    });

    const unreadCount = await Notification.countDocuments({ userId, isRead: false });

    emitToUser(userId, EVENTS.NOTIFICATION_UNREAD_COUNT, {
        count: unreadCount
    })

    return notification;
}

async function markAllAsRead({ tenant, userId }) {

    const Notification = getTenantModel(tenant.dbName, 'Notification', notificationSchema);

    await Notification.updateMany(
        {
            userId,
            isRead: false
        },
        {
            isRead: true,
            readAt: new Date()
        }
    );

    const unreadCount = await Notification.countDocuments({ userId, isRead: false });
    emitToUser(userId, EVENTS.NOTIFICATION_UNREAD_COUNT, {
        count: unreadCount
    });
}

async function getUnreadCount({ tenant, userId }) {

    const Notification = getTenantModel(tenant.dbName, 'Notification', notificationSchema);

    return Notification.countDocuments({
        userId,
        isRead: false
    });
}

module.exports = {
    createNotification,
    createBulkNotifications,
    markAsRead,
    markAllAsRead,
    getUnreadCount
};