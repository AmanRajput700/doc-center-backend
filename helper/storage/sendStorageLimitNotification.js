const getTenantModel = require('../../utils/getTenantModel');
const userSchema = require('../../models/tenant/userSchema');
const { createBulkNotifications } = require('../../services/notificationService');

module.exports = async function ({ tenant, percentage, storageUsed, storageLimit }) {
    const User = getTenantModel(tenant.dbName, 'User', userSchema);

    const users = await User.find({ status: "active" }).populate('role');

    const admins = users
        .filter((user) => {
            return ['Admin'].includes(user.role.name);
        })
        .map((user) => {
            return user._id;
        });

    if (!admins.length) return;

    await createBulkNotifications({
        tenant,
        userIds: admins,
        title: 'Storage Usage Warning',
        message: `Storage usage has exceeded ${percentage}% of the allocated storage limit.`,
        type: 'ALERT',
        metadata: {
            percentage,
            storageUsed,
            storageLimit
        }
    });
};