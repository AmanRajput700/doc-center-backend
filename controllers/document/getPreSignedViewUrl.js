const documentSchema = require('../../models/tenant/documentSchema');
const mongoose = require('mongoose');
const createHttpError = require('http-errors');
const { STATUS_CODE, ERROR_MESSAGE } = require('../../utils/constant');
const { generateGetObjectUrl } = require('../../services/s3.service');

module.exports = async function (docId, tenant) {
    const { dbName, _id: tenantId } = tenant;

    const tenantDB = mongoose.connection.useDb(dbName);

    const Document = tenantDB.models.Document || tenantDB.model('Document', documentSchema);

    const document = await Document.findOne({
        _id: docId,
        tenantId,
        isDeleted: false
    });
    if (!document) throw new createHttpError(STATUS_CODE.NOT_FOUND, ERROR_MESSAGE.DOC_NOT_FOUND);

    const url = await generateGetObjectUrl(document.s3Key);
    return { url };
};