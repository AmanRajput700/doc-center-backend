const sendStorageLimitNotification = require('./sendStorageLimitNotification');
const { STORAGE_LIMIT } = require('../../utils/constant');

module.exports = async function ({ tenant, storageUsed, incomingSize, plan }) {

    const currentPercentage = (storageUsed / plan.storageLimit) * 100;

    const afterUploadPercentage = ((storageUsed + incomingSize) / plan.storageLimit) * 100;

    const crossed80Percent = currentPercentage < STORAGE_LIMIT.WARNING && afterUploadPercentage >= STORAGE_LIMIT.WARNING;

    if (crossed80Percent) {
        await sendStorageLimitNotification({
            tenant,
            percentage: Math.floor(afterUploadPercentage),
            storageUsed: storageUsed + incomingSize,
            storageLimit: plan.storageLimit
        });
    }
};