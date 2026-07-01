const createHttpError = require('http-errors');
const getTenantModel = require('../../utils/getTenantModel');
const documentSchema = require('../../models/tenant/documentSchema');
const { STATUS_CODE, ERROR_MESSAGE } = require('../../utils/constant');
const storageSchema = require('../../models/tenant/storageSchema');


module.exports = async function (docId, tenant) {
    const { dbName, _id: tenantId } = tenant;
    const Document = getTenantModel(dbName, 'Document', documentSchema);
    const Storage = getTenantModel(dbName, 'Storage', storageSchema);

    const restoredDocs = await Document.findOneAndUpdate(
        {
            docId,
            isDeleted: true
        },
        {
            $set: {
                isDeleted: false,
                deletedAt: null
            }
        },
        { new: true });
    if (!restoredDocs) throw new createHttpError(STATUS_CODE.NOT_FOUND, ERROR_MESSAGE.DOC_NOT_FOUND);

    await Storage.findOneAndUpdate(
        {
            tenantId
        },
        {
            $inc: {
                totalFiles: 1,
                trashedFiles: -1
            }
        }
    )
    return restoredDocs;
}