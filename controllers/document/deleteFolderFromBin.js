const folderSchema = require('../../models/tenant/folderSchema');
const { deleteObject } = require('../../services/s3.service');
const createHttpError = require('http-errors');
const documentSchema = require('../../models/tenant/documentSchema');
const getTenantModel = require('../../utils/getTenantModel');
const { STATUS_CODE, ERROR_MESSAGE } = require('../../utils/constant');
const storageSchema = require('../../models/tenant/storageSchema');

module.exports = async function (tenant, folderId) {
    const { dbName, _id: tenantId } = tenant;

    let totalSize = 0;
    let deletedFiles = 0;

    const Folder = getTenantModel(dbName, "Folder", folderSchema);
    const Document = getTenantModel(dbName, "Document", documentSchema);
    const Storage = getTenantModel(dbName, "Storage", storageSchema);

    async function deleteFolderPermanent(parentId) {
        const deletedDocs = await Document.find({ folderId: parentId, isDeleted: true, deletedByParent: true });
        for (let doc of deletedDocs) {
            try {
                await deleteObject(doc.s3Key);
            } catch (err) {
                throw new createHttpError(STATUS_CODE.INTERNAL_SERVER_ERROR, 'Unable to permanently delete document');
            }
        }
        totalSize += deletedDocs.reduce(
            (sum, doc) => sum + (doc.size || 0),
            0
        );
        deletedFiles += deletedDocs.length;
        await Document.deleteMany({
            _id: { $in: deletedDocs.map(doc => doc._id) }
        });

        const folders = await Folder.find({ parentFolderId: parentId });

        for (let folder of folders) {
            await deleteFolderPermanent(folder._id);
            await Folder.findByIdAndDelete(folder._id);
        }
    }

    await deleteFolderPermanent(folderId);
    await Folder.findByIdAndDelete(folderId);

    await Storage.findOneAndUpdate(
        {
            tenantId
        },
        {
            $inc: {
                storageUsed: -totalSize,
                trashedFiles: -deletedFiles
            },
            $set: {
                lastStorageUpdatedAt: new Date()
            }
        },
    )

}