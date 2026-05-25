const createHttpError = require('http-errors');
const mongoose = require('mongoose');
const documentSchema = require('../../models/tenant/documentSchema');
const folderSchema = require('../../models/tenant/folderSchema');
const redis = require('../../services/cache');
const userSchema = require('../../models/tenant/userSchema');

module.exports = async function (dbName, parentId) {
    const tenantDB = mongoose.connection.useDb(dbName);

    const cachedDocs = await redis.get(`Document:${dbName}:${parentId || 'root'}`);
    if (cachedDocs) return JSON.parse(cachedDocs);

    const Document = tenantDB.models.Document || tenantDB.model('Document', documentSchema);
    const Folder = tenantDB.models.Folder || tenantDB.model('Folder', folderSchema);
    const User = tenantDB.models.User || tenantDB.model('User', userSchema);

    const docQuery = { isDeleted: false, folderId: parentId || null };
    const folderQuery = { isDeleted: false, parentFolderId: parentId || null };
    const docs = await Document.find(docQuery).populate('uploadedBy', 'firstName lastName email').sort({ createdAt: -1 });
    const folder = await Folder.find(folderQuery).populate('createdBy', 'firstName lastName email').sort({ createdAt: -1 });
    const response = { docs, folder };
    await redis.set(`Document:${dbName}:${parentId || 'root'}`, JSON.stringify(response), 'EX', 300);
    if (docs.length === 0 && folder.length === 0) return [];
    return response;
}