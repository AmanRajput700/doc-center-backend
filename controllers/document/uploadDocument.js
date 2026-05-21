const createHttpError = require('http-errors');
const mongoose = require('mongoose');
const documentSchema = require('../../models/tenant/documentSchema');
const redis = require('../../services/cache');

module.exports = async function (docData, file, uploadedBy, dbName) {
    const { name, type, parentId } = docData;
    const tenantDB = mongoose.connection.useDb(dbName);
    const Document = tenantDB.models.Document || tenantDB.model('Document', documentSchema);

    let docs;
    if (!file) {
        docs = await Document.create({
            name,
            type: 'folder',
            parentId: parentId || null,
            uploadedBy
        });
    } else {
        const { size, originalname, path } = file;

        docs = await Document.create({
            name: originalname,
            type,
            originalFileName: originalname,
            parentId: parentId || null,
            uploadedBy,
            size,
            url: path
        });
    }

    await redis.del(`Document:${dbName}:${parentId || 'root'}`);
    return docs;
}