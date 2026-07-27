const createHttpError = require('http-errors');

const folderSchema = require('../../models/tenant/folderSchema');
const documentSchema = require('../../models/tenant/documentSchema');

const getTenantModel = require('../../utils/getTenantModel');
const withTransaction = require('../../utils/withTransaction');

const { deleteObject } = require('../../services/s3.service');
const { updateApiAnalytics } = require('../../services/analyticsService');
const { emitToTenant } = require('../../socket/services/emitService');

const { STATUS_CODE } = require('../../utils/constant');
const { DOCUMENT_DELETED, FOLDER_DELETED } = require('../../socket/constants/events');

module.exports = async function (tenant) {

    const { dbName, _id: tenantId } = tenant;

    const Folder = getTenantModel(dbName, 'Folder', folderSchema);
    const Document = getTenantModel(dbName, 'Document', documentSchema);

    const documentsToDelete = await Document.find({
        isDeleted: true
    }).lean();

    const foldersToDelete = await Folder.find({
        isDeleted: true
    }).lean();

    if (documentsToDelete.length === 0 && foldersToDelete.length === 0) return true;


    // Delete S3 objects first
    for (const doc of documentsToDelete) {
        try {
            await deleteObject(doc.s3Key);
        } catch (err) {
            throw new createHttpError(STATUS_CODE.INTERNAL_SERVER_ERROR, `Unable to delete ${doc.originalFileName} from storage.`);
        }

    }

    // Delete MongoDB records
    await withTransaction(async (session) => {

        if (documentsToDelete.length > 0) {
            await Document.deleteMany(
                { isDeleted: true },
                { session }
            );
        }

        if (foldersToDelete.length > 0) {
            await Folder.deleteMany(
                { isDeleted: true },
                { session }
            );
        }
    });

    // Recalculate storage usage
    const [storageStats] = await Document.aggregate([
        {
            $match: {
                uploadStatus: 'uploaded',
                isDeleted: false
            }
        },
        {
            $group: {
                _id: null,
                storageUsed: {
                    $sum: '$size'
                }
            }
        }
    ]);

    await updateApiAnalytics({
        dbName,
        set: {
            storageUsed: storageStats?.storageUsed || 0
        }
    });

    emitToTenant(tenantId, DOCUMENT_DELETED);
    emitToTenant(tenantId, FOLDER_DELETED);

    return true;
};