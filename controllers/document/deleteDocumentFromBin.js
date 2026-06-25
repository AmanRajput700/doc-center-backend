const createHttpError = require('http-errors');
const documentSchema = require('../../models/tenant/documentSchema');
const { deleteObject } = require('../../services/s3.service');
const getTenantModel = require('../../utils/getTenantModel');
const { STATUS_CODE, ERROR_MESSAGE } = require('../../utils/constant');
const storageSchema = require('../../models/tenant/storageSchema');
const apiAnalyticsSchema = require('../../models/tenant/apiAnalyticsSchema');

module.exports = async function (tenant, docId) {
    const { dbName, _id: tenantId } = tenant;

    const Document = getTenantModel(dbName, 'Document', documentSchema);
    const Storage = getTenantModel(dbName, 'Storage', storageSchema);
    const ApiAnalytics = getTenantModel(dbName, 'ApiAnalytics', apiAnalyticsSchema);

    const doc = await Document.findOne({ _id: docId, isDeleted: true });
    if (!doc) throw new createHttpError(STATUS_CODE.NOT_FOUND, ERROR_MESSAGE.DOC_NOT_FOUND);


    try {
        await deleteObject(doc.s3Key);
        await Document.findByIdAndDelete(docId);
    } catch (error) {
        throw new createHttpError(STATUS_CODE.INTERNAL_SERVER_ERROR, 'Unable to permanently delete document');
    }

    const storage = await Storage.findOneAndUpdate(
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
            new: true
        }
    ).lean();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await ApiAnalytics.findOneAndUpdate(
        {
            date: today
        },
        {
            $set: {
                storageUsed: storage.storageUsed
            },
            $setOnInsert: {
                requests: 0
            }
        },
        {
            upsert: true,
            new: true
        }
    );

    return doc;
}