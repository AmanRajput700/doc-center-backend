const mongoose = require('mongoose');
const documentSchema = require('../../models/tenant/documentSchema');
const createHttpError = require('http-errors');
const { STATUS_CODE, ERROR_MESSAGE } = require('../../utils/constant');

module.exports = async function (documentId, tenant) {
    const { dbName } = tenant;

    const tenantDB = mongoose.connection.useDb(dbName);
    const Document = tenantDB.models.Document || tenantDB.model('Document', documentSchema);

    const uploadedDocument = await Document.updateOne({ _id: documentId, uploadStatus: 'pending' }, { $set: { uploadStatus: 'uploaded' } });
    if (uploadedDocument.matchedCount === 0) throw new createHttpError(STATUS_CODE.NOT_FOUND, ERROR_MESSAGE.DOC_NOT_FOUND);

    
    return uploadedDocument;
}