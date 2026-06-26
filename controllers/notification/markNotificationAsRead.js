const getTenantModel = require('../../utils/getTenantModel');
const notificationSchema = require('../../models/tenant/notificationSchema');
const createHttpError = require('http-errors');
const { STATUS_CODE, ERROR_MESSAGE } = require('../../utils/constant');
const { emitToUser } = require('../../socket/services/emitService');
const EVENTS = require('../../socket/constants/events');
const { markAsRead } = require('../../services/notificationService');

module.exports = async function (notificationId, user, tenant) {
    const { _id: tenantId, dbName } = tenant;
    const { _id: userId } = user;

    const data = {
        tenant,
        notificationId,
        userId
    }
    
    const updatedNotification = await markAsRead(data);
    return updatedNotification;
}