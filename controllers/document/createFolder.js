const getTenantModel = require('../../utils/getTenantModel');
const createHttpError = require('http-errors');
const folderSchema = require('../../models/tenant/folderSchema');
const { STATUS_CODE, ERROR_MESSAGE } = require('../../utils/constant');
const redis = require('../../services/cache');

module.exports = async function (userId, folderData, tenant) {

    let { name, parentFolderId = null } = folderData;
    const { dbName, _id: tenantId } = tenant;

    const Folder = getTenantModel(dbName, 'Folder', folderSchema);;
    if (parentFolderId) {
        const parentFolder = await Folder.findOne({ _id: parentFolderId, isDeleted: false });

        if (!parentFolder) {
            throw new createHttpError(STATUS_CODE.NOT_FOUND, 'Parent folder not found');
        }
    }

    const folder = await Folder.create({
        tenantId,
        name,
        parentFolderId,
        createdBy: userId
    });

    await redis.del(`Document:${dbName}:${parentFolderId || 'root'}`);
    return folder;
}