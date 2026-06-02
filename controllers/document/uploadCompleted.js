const getTenantModel = require('../../utils/getTenantModel');
const documentSchema = require('../../models/tenant/documentSchema');
const createHttpError = require('http-errors');
const { STATUS_CODE, ERROR_MESSAGE } = require('../../utils/constant');
const storageSchema = require('../../models/tenant/storageSchema');

module.exports = async function (documentId, tenant) {
    const { dbName, _id: tenantId } = tenant;
    const Document = getTenantModel(dbName, 'Document', documentSchema);
    const Storage = getTenantModel(dbName, 'Storage', storageSchema);

    const document = await Document.findOneAndUpdate(
        {
            _id: documentId,
            uploadStatus: 'pending'
        },
        {
            $set: {
                uploadStatus: 'uploaded'
            }
        },
        {
            returnDocument: 'after'
        }
    );
    if (!document) throw new createHttpError(STATUS_CODE.NOT_FOUND, ERROR_MESSAGE.DOC_NOT_FOUND);
    await Storage.findOneAndUpdate(
        {
            tenantId
        },
        {
            $inc: {
                totalFiles: 1,
                storageUsed: document.size
            },
            $set: {
                lastStorageUpdatedAt: new Date()
            }
        }
    );

    return document;
}