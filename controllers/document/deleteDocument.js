const createHttpError = require('http-errors');

const getTenantModel = require('../../utils/getTenantModel');
const withTransaction = require('../../utils/withTransaction');

const documentSchema = require('../../models/tenant/documentSchema');

const { ERROR_MESSAGE, STATUS_CODE } = require('../../utils/constant');
const { emitToTenant } = require('../../socket/services/emitService');
const { DOCUMENT_TRASHED } = require('../../socket/constants/events');

module.exports = async function (docId, tenant) {

    const { dbName, _id: tenantId } = tenant;

    const Document = getTenantModel(dbName, 'Document', documentSchema);

    const document = await withTransaction(async (session) => {

        const deletedDocument = await Document.findOneAndUpdate(
            {
                _id: docId,
                isDeleted: false
            },
            {
                $set: {
                    isDeleted: true,
                    deletedByParent: false,
                    deletedAt: new Date()
                }
            },
            {
                new: true,
                session
            }
        );

        if (!deletedDocument) throw new createHttpError(STATUS_CODE.NOT_FOUND, ERROR_MESSAGE.DOC_NOT_FOUND);
        return deletedDocument;
    });

    emitToTenant(tenantId, DOCUMENT_TRASHED);
    return document;
};