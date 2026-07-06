const createHttpError = require('http-errors');

const getTenantModel = require('../../utils/getTenantModel');
const withTransaction = require('../../utils/withTransaction');

const documentSchema = require('../../models/tenant/documentSchema');
const folderSchema = require('../../models/tenant/folderSchema');
const storageSchema = require('../../models/tenant/storageSchema');

const { STATUS_CODE, ERROR_MESSAGE } = require('../../utils/constant');
const { emitToTenant } = require('../../socket/services/emitService');
const { DOCUMENT_RESTORED } = require('../../socket/constants/events');

module.exports = async function (docId, tenant) {

    const { dbName, _id: tenantId } = tenant;

    const Document = getTenantModel(dbName, 'Document', documentSchema);
    const Folder = getTenantModel(dbName, 'Folder', folderSchema);
    const Storage = getTenantModel(dbName, 'Storage', storageSchema);

    const doc = await Document.findOne({ _id: docId, isDeleted: true }).lean();
    if (!doc) throw new createHttpError(STATUS_CODE.NOT_FOUND, ERROR_MESSAGE.DOC_NOT_FOUND);


    if (doc.folderId) {

        const parentFolder = await Folder.findById(doc.folderId).lean();

        if (parentFolder?.isDeleted) {
            throw new createHttpError(
                STATUS_CODE.BAD_REQUEST,
                'Cannot restore this document while its parent folder is still in the bin. Restore the folder first.'
            );
        }
    }

    const restoredDocument = await withTransaction(async (session) => {

        const updatedDocument = await Document.findOneAndUpdate(
            {
                _id: docId,
                isDeleted: true
            },
            {
                $set: {
                    isDeleted: false,
                    deletedAt: null,
                    deletedByParent: false
                }
            },
            {
                new: true,
                session
            }
        );

        if (!updatedDocument) {
            throw new createHttpError(
                STATUS_CODE.NOT_FOUND,
                ERROR_MESSAGE.DOC_NOT_FOUND
            );
        }

        await Storage.findOneAndUpdate(
            {
                tenantId
            },
            {
                $inc: {
                    totalFiles: 1,
                    trashedFiles: -1
                },
                $set: {
                    lastStorageUpdatedAt: new Date()
                }
            },
            {
                session
            }
        );

        return updatedDocument;
    });

    emitToTenant(tenantId, DOCUMENT_RESTORED);
    return restoredDocument;
};