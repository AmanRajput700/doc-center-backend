const mongoose = require('mongoose');
const redis = require('../../services/cache');
const documentSchema = require('../../models/tenant/documentSchema');
const { ERROR_MESSAGE, STATUS_CODE } = require('../../utils/constant');

module.exports = async function (docId, data, dbName) {
    const { name } = data
    const tenantDB = mongoose.connection.useDb(dbName);

    const Document = tenantDB.models.Document || tenantDB.model('Document', documentSchema);

    const updatedDoc = await Document.findByIdAndUpdate(docId, { name }, { new: true });
    if (!updatedDoc) throw new createHttpError(STATUS_CODE.NOT_FOUND, ERROR_MESSAGE.DOC_NOT_FOUND);
    return updatedDoc;
}