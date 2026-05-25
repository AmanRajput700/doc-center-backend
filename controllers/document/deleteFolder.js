const mongoose = require('mongoose');
const redis = require('../../services/cache');
const folderSchema = require('../../models/tenant/folderSchema');
const { ERROR_MESSAGE, STATUS_CODE } = require('../../utils/constant');
const createHttpError = require('http-errors');

module.exports = async function (folderId, dbName) {
    const tenantDB = mongoose.connection.useDb(dbName);

    const Folder = tenantDB.models.Folder || tenantDB.model('Folder', folderSchema);

    const folder = await Folder.findById(folderId);

    if (!folder) throw createHttpError(STATUS_CODE.NOT_FOUND, ERROR_MESSAGE.FOLDER_NOT_FOUND);

    async function softDeleteChild(parentId) {
        const folders = await Folder.find({ parentFolderId: parentId, isDeleted: false });

        for (let folder of folders) {
            folder.isDeleted = true;
            folder.deletedAt = new Date();
            await folder.save();
            await softDeleteChild(folder._id);
        }
    }

    folder.isDeleted = true;
    folder.deletedAt = new Date();
    await folder.save();
    await softDeleteChild(folder._id);
    await redis.del(`Document:${dbName}:${folder.parentFolderId || 'root'}`);

    return folder;
}