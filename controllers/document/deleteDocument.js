const getTenantModel = require('../../utils/getTenantModel');
const documentSchema = require('../../models/tenant/documentSchema');
const { ERROR_MESSAGE, STATUS_CODE } = require('../../utils/constant');
const createHttpError = require('http-errors');

module.exports = async function (docId, dbName) {
    const Document = getTenantModel(dbName, 'Document', documentSchema);

    const document = await Document.findByIdAndUpdate(docId, { isDeleted: true, deletedAt: new Date() }, {returnDocument: 'after'});
    if (!document) throw new createHttpError(STATUS_CODE.NOT_FOUND, ERROR_MESSAGE.DOC_NOT_FOUND);

    return document;
};
