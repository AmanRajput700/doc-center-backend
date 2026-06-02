const createHttpError = require('http-errors');
const getTenantModel = require('../../utils/getTenantModel');
const documentSchema = require('../../models/tenant/documentSchema');
const folderSchema = require('../../models/tenant/folderSchema');
const { STATUS_CODE, ERROR_MESSAGE } = require('../../utils/constant');

module.exports = async function (folderId, dbName) {
    const Folder = getTenantModel(dbName, 'Folder', folderSchema);
    const Document = getTenantModel(dbName, 'Document', documentSchema);

    const folder = await Folder.findById(folderId);
    if (!folder) throw new createHttpError(STATUS_CODE.NOT_FOUND, ERROR_MESSAGE.FOLDER_NOT_FOUND);

    async function restoreDocs(parentId) {
        await Document.updateMany(
            {
                folderId: parentId,
                deletedAt: { $gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7) }
            },
            {
                isDeleted: false,
                deletedAt: null
            },
        );

        const folders = await Folder.find({ parentFolderId: parentId, isDeleted: true });

        for (const folder of folders) {
            folder.isDeleted = false;
            folder.deletedAt = null;
            await folder.save();
            await restoreDocs(folder._id);
        }
    }

    folder.isDeleted = false;
    folder.deletedAt = null;
    await folder.save();
    await restoreDocs(folderId);

    return folder;
}