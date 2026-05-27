const createHttpError = require('http-errors');
const documentSchema = require('../../models/tenant/documentSchema');
const getTenantModel = require('../../utils/getTenantModel');
const { generateGetObjectUrl } = require('../../services/s3.service');
const { STATUS_CODE, ERROR_MESSAGE } = require('../../utils/constant');

module.exports = async function (expiryTime, docId, dbName, tenantId) {
    expiryTime = parseInt(expiryTime) * 60;
    const Document = getTenantModel(dbName, 'Document', documentSchema);

    const document = await Document.findOne({ _id: docId, isDeleted: false, tenantId });
    if (!document) throw new createHttpError(STATUS_CODE.NOT_FOUND, ERROR_MESSAGE.DOC_NOT_FOUND);

    const url = await generateGetObjectUrl(document.s3Key, expiryTime);

    return { url };
};