const { markAllAsRead } = require('../../services/notificationService');

module.exports = async function (tenant, user) {
    await markAllAsRead({ tenant, userId: user._id });
}