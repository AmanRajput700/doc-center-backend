const createHttpError = require('http-errors');

const documentSchema = require('../../models/tenant/documentSchema');
const storageSchema = require('../../models/tenant/storageSchema');

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

    const Storage = getTenantModel(dbName, 'Storage', storageSchema);

    const doc = await Document.findOne({ _id: docId, isDeleted: true });

    if (!doc)
        throw new createHttpError(STATUS_CODE.NOT_FOUND, ERROR_MESSAGE.DOC_NOT_FOUND);


    try {
        await deleteObject(doc.s3Key);
    } catch (error) {
        throw new createHttpError(STATUS_CODE.INTERNAL_SERVER_ERROR, 'Unable to permanently delete document.');
    }

    // MongoDB transaction
    const storage = await withTransaction(async (session) => {
        await Document.findByIdAndDelete(doc._id, { session });
        return await Storage.findOneAndUpdate(
            {
                tenantId
            },
            {
                $inc: {
                    storageUsed: -doc.size,
                    trashedFiles: -1
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

    return doc;
};