const getTenantModel = require('../../utils/getTenantModel');
const sendStorageLimitNotification = require('./sendStorageLimitNotification');
const { STORAGE_LIMIT } = require('../../utils/constant');

module.exports = async function ({ tenant, storage, incomingSize, plan }) {

    const currentPercentage = (storage.storageUsed / plan.storageLimit) * 100;
    const afterUploadPercentage = ((storage.storageUsed + incomingSize) / plan.storageLimit) * 100;

    const crossed80Percent = currentPercentage < STORAGE_LIMIT.WARNING && afterUploadPercentage >= STORAGE_LIMIT.WARNING;

    if (crossed80Percent) {
        await sendStorageLimitNotification({
            tenant,
            percentage: Math.floor(afterUploadPercentage),
            storageUsed: storage.storageUsed + incomingSize,
            storageLimit: plan.storageLimit
        });
    }
}