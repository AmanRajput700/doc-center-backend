const createHttpError = require('http-errors');
const getTenantModel = require('../../utils/getTenantModel');
const documentSchema = require('../../models/tenant/documentSchema');
const folderSchema = require('../../models/tenant/folderSchema');
const storageSchema = require('../../models/tenant/storageSchema');
const { STATUS_CODE, ERROR_MESSAGE } = require('../../utils/constant');

module.exports = async function (folderId, tenant) {
    const { dbName, _id: tenantId } = tenant;
    const Folder = getTenantModel(dbName, 'Folder', folderSchema);
    const Document = getTenantModel(dbName, 'Document', documentSchema);
    const Storage = getTenantModel(dbName, 'Storage', storageSchema);

    const folder = await Folder.findById(folderId);
    if (!folder) throw new createHttpError(STATUS_CODE.NOT_FOUND, ERROR_MESSAGE.FOLDER_NOT_FOUND);

    let addedFile = 0;
    let addedFolder = 0;

    async function restoreDocs(parentId) {
        const docs = await Document.updateMany(
            {
                folderId: parentId,
                isDeleted: true,
                deletedByParent: true,
                deletedAt: { $gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7) }
            },
            {
                isDeleted: false,
                deletedAt: null,
                deletedByParent: false
            },
        );
        addedFile += docs.modifiedCount;

        const folders = await Folder.find({ parentFolderId: parentId, isDeleted: true, deletedByParent: true });

        for (const folder of folders) {
            addedFolder++;
            folder.isDeleted = false;
            folder.deletedAt = null;
            folder.deletedByParent = null;
            await folder.save();
            await restoreDocs(folder._id);
        }
    }

    folder.isDeleted = false;
    folder.deletedAt = null;
    await folder.save();
    addedFolder++;
    await restoreDocs(folderId);

    await Storage.findOneAndUpdate(
        {
            tenantId
        },
        {
            $inc: {
                totalFolders: addedFolder,
                trashedFiles: -addedFile,
                totalFiles: addedFile
            }
        }
    );

    return folder;
}