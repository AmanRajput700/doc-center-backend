const mongoose = require('mongoose');
const redis = require('../../services/cache');
const folderSchema = require('../../models/tenant/folderSchema');
const { ERROR_MESSAGE, STATUS_CODE } = require('../../utils/constant');
const createHttpError = require('http-errors');

module.exports = async function (folderId, data, dbName) {
    const { name } = data;
    const tenantDB = mongoose.connection.useDb(dbName);

    const Folder = tenantDB.models.Folder || tenantDB.model('Folder', folderSchema);

    const updatedFolder = await Folder.findByIdAndUpdate(folderId, { name }, { new: true });
    if (!updatedFolder) throw new createHttpError(STATUS_CODE.NOT_FOUND, ERROR_MESSAGE.FOLDER_NOT_FOUND);
    await redis.del(`Document:${dbName}:${updatedFolder.parentFolderId || 'root'}`);
    return updatedFolder;
}