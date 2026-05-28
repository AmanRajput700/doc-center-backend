const getTenantModel = require('../../utils/getTenantModel');
const documentSchema = require('../../models/tenant/documentSchema');
const createHttpError = require('http-errors');
const { STATUS_CODE, ERROR_MESSAGE } = require('../../utils/constant');

module.exports = async function (documentId, tenant) {
    const { dbName } = tenant;
    const Document = getTenantModel(dbName, 'Document', documentSchema);

    const deletedDocument = await Document.findByIdAndDelete(documentId);
    if (!deletedDocument) throw new createHttpError(STATUS_CODE.NOT_FOUND, ERROR_MESSAGE.DOC_NOT_FOUND);
    return deletedDocument;
}