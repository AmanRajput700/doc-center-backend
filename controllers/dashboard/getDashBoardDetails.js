const createHttpError = require('http-errors');
const getTenantModel = require('../../utils/getTenantModel');
const documentSchema = require('../../models/tenant/documentSchema');
const userSchema = require('../../models/tenant/userSchema');
const storageSchema = require('../../models/tenant/storageSchema');
const plans = require('../../config/plans');

module.exports = async function (tenant) {

    const { dbName, _id: tenantId, currentPlan } = tenant;

    const Document = getTenantModel(dbName, 'Document', documentSchema);
    const User = getTenantModel(dbName, 'User', userSchema);
    const Storage = getTenantModel(dbName, 'Storage', storageSchema);

    const storageDetails = await Storage.findOne({ tenantId });
    const planDetails = plans[currentPlan];

    const lastSevenDays = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7);
    const docsAddedThisWeek = await Document.countDocuments({ isDeleted: false, uploadStatus: 'uploaded', createdAt: { $gte: lastSevenDays } });
    return { storageDetails, planDetails, docsAddedThisWeek };
};