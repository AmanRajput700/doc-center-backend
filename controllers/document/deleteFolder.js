const getTenantModel = require('../../utils/getTenantModel');
const folderSchema = require('../../models/tenant/folderSchema');
const { ERROR_MESSAGE, STATUS_CODE } = require('../../utils/constant');
const createHttpError = require('http-errors');
const documentSchema = require('../../models/tenant/documentSchema');
const storageSchema = require('../../models/tenant/storageSchema');

module.exports = async function (folderId, tenant) {
    const { dbName, _id: tenantId } = tenant;
    const Folder = getTenantModel(dbName, 'Folder', folderSchema);
    const Document = getTenantModel(dbName, 'Document', documentSchema);
    const Storage = getTenantModel(dbName, 'Storage', storageSchema);

    const folder = await Folder.findOne({ _id: folderId, isDeleted: false });

    if (!folder) throw createHttpError(STATUS_CODE.NOT_FOUND, ERROR_MESSAGE.FOLDER_NOT_FOUND);

    let deletedFiles = 0;
    let deletedFolders = 0;

    async function softDeleteChild(parentId) {

        const deletedDocs = await Document.updateMany(
            {
                folderId: parentId,
                isDeleted: false
            },
            {
                $set: {
                    isDeleted: true,
                    deletedAt: new Date(),
                    deletedByParent: true
                }
            }
        );
        deletedFiles += deletedDocs.modifiedCount;
        const folders = await Folder.find({ parentFolderId: parentId, isDeleted: false });

        for (let folder of folders) {
            deletedFolders++;
            folder.isDeleted = true;
            folder.deletedAt = new Date();
            folder.deletedByParent = true;
            await folder.save();
            await softDeleteChild(folder._id);
        }
    }

    folder.isDeleted = true;
    folder.deletedAt = new Date();
    folder.deletedByParent = false;
    await folder.save();
    deletedFolders++;
    await softDeleteChild(folder._id);

    await Storage.findOneAndUpdate(
        {
            tenantId
        },
        {
            $inc: {
                totalFolders: -deletedFolders,
                totalFiles: -deletedFiles,
                trashedFiles: deletedFiles
            },
            $set: {
                lastStorageUpdatedAt: new Date()
            }
        }
    );

    return folder;
}