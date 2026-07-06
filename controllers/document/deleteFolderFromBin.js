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
const { FOLDER_DELETED } = require('../../socket/constants/events');

module.exports = async function (tenant, folderId) {

    const { dbName, _id: tenantId } = tenant;

    const Folder = getTenantModel(dbName, 'Folder', folderSchema);
    const Document = getTenantModel(dbName, 'Document', documentSchema);
    const Storage = getTenantModel(dbName, 'Storage', storageSchema);

    let totalSize = 0;
    let deletedFiles = 0;
    let deletedFolders = 0;

    const documentsToDelete = [];
    const foldersToDelete = [];

    async function collectItems(parentId) {

        const docs = await Document.find({
            folderId: parentId,
            isDeleted: true,
            deletedByParent: true
        }).lean();

        documentsToDelete.push(...docs);

        docs.forEach(doc => {
            totalSize += doc.size || 0;
        });

        const folders = await Folder.find({
            parentFolderId: parentId,
            isDeleted: true
        }).lean();

        for (const folder of folders) {
            foldersToDelete.push(folder);
            await collectItems(folder._id);
        }
    }

    await collectItems(folderId);

    const rootFolder = await Folder.findOne({
        _id: folderId,
        isDeleted: true
    });

    if (!rootFolder) {
        throw new createHttpError(
            STATUS_CODE.NOT_FOUND,
            ERROR_MESSAGE.FOLDER_NOT_FOUND
        );
    }

    foldersToDelete.push(rootFolder);

    deletedFiles = documentsToDelete.length;
    deletedFolders = foldersToDelete.length;

    // Delete S3 objects first
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

        if (documentsToDelete.length) {
            await Document.deleteMany(
                {
                    _id: {
                        $in: documentsToDelete.map(doc => doc._id)
                    }
                },
                { session }
            );
        }

        await Folder.deleteMany(
            {
                _id: {
                    $in: foldersToDelete.map(folder => folder._id)
                }
            },
            { session }
        );

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

    emitToTenant(tenantId, FOLDER_DELETED);

    return rootFolder;
};