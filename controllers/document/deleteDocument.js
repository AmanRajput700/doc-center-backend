const getTenantModel = require('../../utils/getTenantModel');
const documentSchema = require('../../models/tenant/documentSchema');
const { ERROR_MESSAGE, STATUS_CODE } = require('../../utils/constant');
const createHttpError = require('http-errors');
const storageSchema = require('../../models/tenant/storageSchema');

module.exports = async function (docId, tenant) {
    const { dbName, _id: tenantId } = tenant;
    const Document = getTenantModel(dbName, 'Document', documentSchema);
    const Storage = getTenantModel(dbName, 'Storage', storageSchema);

    const document = await Document.findOneAndUpdate({ _id: docId, isDeleted: false }, { isDeleted: true, deletedByParent: false, deletedAt: new Date() }, { returnDocument: 'after' });
    if (!document) throw new createHttpError(STATUS_CODE.NOT_FOUND, ERROR_MESSAGE.DOC_NOT_FOUND);

    await Storage.findOneAndUpdate(
        {
            tenantId
        },
        {
            $inc: {
                trashedFiles: 1,
                totalFiles: -1
            },
            $set: {
                lastStorageUpdatedAt: new Date()
            }
        }
    );

    return document;
};
