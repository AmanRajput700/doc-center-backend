const createHttpError = require('http-errors');

const documentSchema = require('../../models/tenant/documentSchema');

const getTenantModel = require('../../utils/getTenantModel');
const withTransaction = require('../../utils/withTransaction');

const { deleteObject } = require('../../services/s3.service');
const { updateApiAnalytics } = require('../../services/analyticsService');
const { emitToTenant } = require('../../socket/services/emitService');

const { STATUS_CODE, ERROR_MESSAGE } = require('../../utils/constant');
const { DOCUMENT_DELETED } = require('../../socket/constants/events');

module.exports = async function (tenant, docId) {

    const { dbName, _id: tenantId } = tenant;

    const Document = getTenantModel(dbName, 'Document', documentSchema);

    const doc = await Document.findOne({
        _id: docId,
        isDeleted: true
    });

    if (!doc) throw new createHttpError(STATUS_CODE.NOT_FOUND, ERROR_MESSAGE.DOC_NOT_FOUND);

    try {
        await deleteObject(doc.s3Key);
    } catch (error) {
        throw new createHttpError(STATUS_CODE.INTERNAL_SERVER_ERROR, 'Unable to permanently delete document.');
    }

    // Delete document
    await withTransaction(async (session) => {
        await Document.findByIdAndDelete(
            doc._id,
            { session }
        );
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

    return doc;
};