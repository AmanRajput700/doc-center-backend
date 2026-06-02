const createHttpError = require('http-errors');
const getTenantModel = require('../../utils/getTenantModel');
const documentSchema = require('../../models/tenant/documentSchema');
const { STATUS_CODE, ERROR_MESSAGE } = require('../../utils/constant');

module.exports = async function (docId, dbName) {
    const Document = getTenantModel(dbName, 'Document', documentSchema);

    const restoredDocs = await Document.findByIdAndUpdate(docId, { $set: { isDeleted: false, deletedAt: null } }, { new: true });
    if (!restoredDocs) throw new createHttpError(STATUS_CODE.NOT_FOUND, ERROR_MESSAGE.DOC_NOT_FOUND);
    return restoredDocs;
}