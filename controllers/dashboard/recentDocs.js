const createHttpError = require('http-errors');
const getTenantModel = require('../../utils/getTenantModel');
const documentSchema = require('../../models/tenant/documentSchema');
const userSchema = require('../../models/tenant/userSchema');

module.exports = async function (limit, tenant) {
    const { dbName } = tenant;
    const docLimit = Math.min(limit || 5, 10);
    const Document = getTenantModel(dbName, 'Document', documentSchema);
    const User = getTenantModel(dbName, 'User', userSchema);
    const docs = await Document.find({ isDeleted: false }).populate('uploadedBy', 'firstName lastName email').sort({ createdAt: -1 }).limit(docLimit)
    return docs;
}