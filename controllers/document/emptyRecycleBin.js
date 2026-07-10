const createHttpError = require('http-errors');

const folderSchema = require('../../models/tenant/folderSchema');
const documentSchema = require('../../models/tenant/documentSchema');
const storageSchema = require('../../models/tenant/storageSchema');

const getTenantModel = require('../../utils/getTenantModel');
const withTransaction = require('../../utils/withTransaction');

const { deleteObject } = require('../../services/s3.service');
const { updateApiAnalytics } = require('../../services/analyticsService');
const { emitToTenant } = require('../../socket/services/emitService');

const { STATUS_CODE, ERROR_MESSAGE } = require('../../utils/constant');
const { DOCUMENT_DELETED, FOLDER_DELETED } = require('../../socket/constants/events');

module.exports = async function (tenant) {

    const { dbName, _id: tenantId } = tenant;

    const Folder = getTenantModel(dbName, 'Folder', folderSchema);
    const Document = getTenantModel(dbName, 'Document', documentSchema);
    const Storage = getTenantModel(dbName, 'Storage', storageSchema);

    const documentsToDelete = await Document.find({ isDeleted: true }).lean();
    const foldersToDelete = await Folder.find({ isDeleted: true }).lean();

    if (documentsToDelete.length === 0 && foldersToDelete.length === 0) {
        return true;
    }

    let totalSize = 0;
    documentsToDelete.forEach(doc => {
        totalSize += doc.size || 0;
    });

    const deletedFiles = documentsToDelete.length;
    const deletedFolders = foldersToDelete.length;

    // Delete S3 objects
    for (const doc of documentsToDelete) {
        try {
            await deleteObject(doc.s3Key);
        } catch (err) {
            throw new createHttpError(
                STATUS_CODE.INTERNAL_SERVER_ERROR,
                `Unable to delete ${doc.originalFileName} from storage.`
            );
        }
    }

    const storage = await withTransaction(async (session) => {

        if (deletedFiles > 0) {
            await Document.deleteMany(
                { isDeleted: true },
                { session }
            );
        }

        if (deletedFolders > 0) {
            await Folder.deleteMany(
                { isDeleted: true },
                { session }
            );
        }

        return await Storage.findOneAndUpdate(
            {
                tenantId
            },
            {
                $inc: {
                    storageUsed: -totalSize,
                    trashedFiles: -deletedFiles,
                    totalFolders: -deletedFolders
                },
                $set: {
                    lastStorageUpdatedAt: new Date()
                }
            },
            {
                new: true,
                session
            }
        ).lean();

    });

    await updateApiAnalytics({
        dbName,
        set: {
            storageUsed: storage.storageUsed
        }
    });

    emitToTenant(tenantId, DOCUMENT_DELETED);
    emitToTenant(tenantId, FOLDER_DELETED);

    return true;
};
