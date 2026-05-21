const createHttpError = require('http-errors');
const mongoose = require('mongoose');
const documentSchema = require('../../models/tenant/documentSchema');
const redis = require('../../services/cache');

module.exports = async function (dbName, parentId) {
    const tenantDB = mongoose.connection.useDb(dbName);

    const cachedDocs = await redis.get(`Document:${dbName}:${parentId || 'root'}`);
    if (cachedDocs) return JSON.parse(cachedDocs);
    const Document = tenantDB.models.Document || tenantDB.model('Document', documentSchema);
    const query = { isDeleted: false, parentId: parentId || null };
    const docs = await Document.find(query).sort({ createdAt: -1 });
    await redis.set(`Document:${dbName}:${parentId || 'root'}`, JSON.stringify(docs), 'EX', 300);
    if (docs.length === 0) return [];
    return docs;
}