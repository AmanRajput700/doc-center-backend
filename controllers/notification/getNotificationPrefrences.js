const getTenantModel = require('../../utils/getTenantModel');
const notificationPreferenceSchema = require('../../models/tenant/notificationPreferenceSchema');
const notificationPrefrenceSeeder = require('../../seeders/tenant/notificationPrefrenceSeeder');

module.exports = async function (tenant, user) {
    const { dbName, _id: tenantId } = tenant;
    const { _id: userId } = user;

    const NotificationPreference = getTenantModel(dbName, 'NotificationPreference', notificationPreferenceSchema);

    const userPrefrences = await NotificationPreference.findOne({ userId, tenantId });
    return userPrefrences;
};