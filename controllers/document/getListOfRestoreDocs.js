const createHttpError = require('http-errors');
const getTenantModel = require('../../utils/getTenantModel');
const documentSchema = require('../../models/tenant/documentSchema');
const folderSchema = require('../../models/tenant/folderSchema');
const userSchema = require('../../models/tenant/userSchema');

module.exports = async function (dbName) {
    const Document = getTenantModel(dbName, 'Document', documentSchema);
    const Folder = getTenantModel(dbName, 'Folder', folderSchema);

    const lastSevenDays = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7);
    const docs = await Document.find({ isDeleted: true, deletedByParent: false, deletedAt: { $gte: lastSevenDays } });
    const folders = await Folder.find({ isDeleted: true, deletedByParent: false, deletedAt: { $gte: lastSevenDays } });

    return { docs, folders };
};