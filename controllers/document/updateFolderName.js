const getTenantModel = require('../../utils/getTenantModel');
const redis = require('../../services/cache');
const folderSchema = require('../../models/tenant/folderSchema');
const { ERROR_MESSAGE, STATUS_CODE } = require('../../utils/constant');
const createHttpError = require('http-errors');

module.exports = async function (folderId, data, dbName) {
    const { name } = data;
    const Folder = getTenantModel(dbName, 'Folder', folderSchema);

    const updatedFolder = await Folder.findByIdAndUpdate(folderId, { name }, {returnDocument: 'after'});
    if (!updatedFolder) throw new createHttpError(STATUS_CODE.NOT_FOUND, ERROR_MESSAGE.FOLDER_NOT_FOUND);
    await redis.del(`Document:${dbName}:${updatedFolder.parentFolderId || 'root'}`);
    return updatedFolder;
}