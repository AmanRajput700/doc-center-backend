const documentSchema = require('../../models/tenant/documentSchema');
const getTenantModel = require('../../utils/getTenantModel');
const createHttpError = require('http-errors');
const { STATUS_CODE, ERROR_MESSAGE } = require('../../utils/constant');
const { generateGetObjectUrl, generateDownloadObjectUrl } = require('../../services/s3.service');

module.exports = async function (docId, tenant) {
    const { dbName, _id: tenantId } = tenant;

    const Document = getTenantModel(dbName, 'Document', documentSchema);

    const document = await Document.findOne({
        _id: docId,
        tenantId,
        isDeleted: false
    });
    if (!document) throw new createHttpError(STATUS_CODE.NOT_FOUND, ERROR_MESSAGE.DOC_NOT_FOUND);

    const url = await generateDownloadObjectUrl(document.s3Key, document.storedName);
    return url;
};