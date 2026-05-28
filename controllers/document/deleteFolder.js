const getTenantModel = require('../../utils/getTenantModel');
const folderSchema = require('../../models/tenant/folderSchema');
const { ERROR_MESSAGE, STATUS_CODE } = require('../../utils/constant');
const createHttpError = require('http-errors');
const documentSchema = require('../../models/tenant/documentSchema');

module.exports = async function (folderId, dbName) {
    const Folder = getTenantModel(dbName, 'Folder', folderSchema);
    const Document = getTenantModel(dbName, 'Document', documentSchema);

    const folder = await Folder.findById(folderId);

    if (!folder) throw createHttpError(STATUS_CODE.NOT_FOUND, ERROR_MESSAGE.FOLDER_NOT_FOUND);

    async function softDeleteChild(parentId) {

        await Document.updateMany(
            {
                folderId: parentId,
                isDeleted: false
            },
            {
                $set: {
                    isDeleted: true,
                    deletedAt: new Date()
                }
            }
        );
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

    return folder;
}