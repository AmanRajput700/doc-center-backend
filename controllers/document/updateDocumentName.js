const getTenantModel = require('../../utils/getTenantModel');
const redis = require('../../services/cache');
const documentSchema = require('../../models/tenant/documentSchema');
const { ERROR_MESSAGE, STATUS_CODE } = require('../../utils/constant');
const createHttpError = require('http-errors');

module.exports = async function (docId, data, dbName) {
    const { name } = data;
    
    const Document = getTenantModel(dbName, 'Document', documentSchema);

    const updatedDoc = await Document.findByIdAndUpdate(docId, { originalFileName: name }, {returnDocument: 'after'});
    if (!updatedDoc) throw new createHttpError(STATUS_CODE.NOT_FOUND, ERROR_MESSAGE.DOC_NOT_FOUND);
    await redis.del(`Document:${dbName}:${updatedDoc.folderId || 'root'}`);
    return updatedDoc;
}