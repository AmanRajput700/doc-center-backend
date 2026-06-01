const createHttpError = require('http-errors');
const getTenantModel = require('../../utils/getTenantModel');
const documentSchema = require('../../models/tenant/documentSchema');
const userSchema = require('../../models/tenant/userSchema');

module.exports = async function (dbName) {
    const Document = getTenantModel(dbName, 'Document', documentSchema);
    const User = getTenantModel(dbName, 'User', userSchema);
    const docCount = await Document.countDocuments({ isDeleted: false });
    const lastSevenDays = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7);
    const docsAddedThisWeek = await Document.countDocuments({ isDeleted: false, createdAt: { $gte: lastSevenDays } });
    const docs = await Document.find({ isDeleted: false }).populate('uploadedBy', 'firstName lastName email').sort({ createdAt: -1 }).limit(5)
    return { docs, docCount, docsAddedThisWeek };
};