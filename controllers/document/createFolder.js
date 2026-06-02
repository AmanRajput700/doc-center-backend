const getTenantModel = require('../../utils/getTenantModel');
const createHttpError = require('http-errors');
const folderSchema = require('../../models/tenant/folderSchema');
const { STATUS_CODE, ERROR_MESSAGE } = require('../../utils/constant');
const redis = require('../../services/cache');
const storageSchema = require('../../models/tenant/storageSchema');


module.exports = async function (userId, folderData, tenant) {

    let { name, parentFolderId = null } = folderData;
    const { dbName, _id: tenantId } = tenant;

    const Folder = getTenantModel(dbName, 'Folder', folderSchema);
    const Storage = getTenantModel(dbName, 'Storage', storageSchema);


    if (parentFolderId) {
        const parentFolder = await Folder.findOne({ _id: parentFolderId, isDeleted: false });

        if (!parentFolder) {
            throw new createHttpError(STATUS_CODE.NOT_FOUND, 'Parent folder not found');
        }
    }

    const originalName = name;

    let counter = 0;
    let folder;

    while (true) {

        try {

            const folderName =
                counter === 0
                    ? originalName
                    : `${originalName}_${counter + 1}`;

            folder = await Folder.create({
                tenantId,
                name: folderName,
                parentFolderId,
                createdBy: userId
            });

            break;

        } catch (error) {

            // Duplicate key error
            if (error.code === 11000) {
                counter++;
                continue;
            }

            throw error;
        }
    }

    await Storage.findOneAndUpdate(
        {
            tenantId
        },
        {
            $inc: {
                totalFolders: 1,
            },
            $set: {
                lastStorageUpdatedAt: new Date()
            }
        }
    );

    return folder;
}