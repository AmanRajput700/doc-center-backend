const createHttpError = require('http-errors');

const getTenantModel = require('../../utils/getTenantModel');
const withTransaction = require('../../utils/withTransaction');

const folderSchema = require('../../models/tenant/folderSchema');
const documentSchema = require('../../models/tenant/documentSchema');
const storageSchema = require('../../models/tenant/storageSchema');

const { ERROR_MESSAGE, STATUS_CODE } = require('../../utils/constant');
const { emitToTenant } = require('../../socket/services/emitService');
const { FOLDER_TRASHED } = require('../../socket/constants/events');

module.exports = async function (folderId, tenant) {

    const { dbName, _id: tenantId } = tenant;

    const Folder = getTenantModel(dbName, 'Folder', folderSchema);
    const Document = getTenantModel(dbName, 'Document', documentSchema);
    const Storage = getTenantModel(dbName, 'Storage', storageSchema);

    const folder = await withTransaction(async (session) => {

        const rootFolder = await Folder.findOneAndUpdate(
            {
                _id: folderId,
                isDeleted: false
            },
            {
                $set: {
                    isDeleted: true,
                    deletedAt: new Date(),
                    deletedByParent: false
                }
            },
            {
                new: true,
                session
            }
        );

        if (!rootFolder) throw new createHttpError(STATUS_CODE.NOT_FOUND, ERROR_MESSAGE.FOLDER_NOT_FOUND);

        let deletedFiles = 0;
        let deletedFolders = 1;

        async function softDeleteChild(parentId) {

            const deletedDocs = await Document.updateMany(
                {
                    folderId: parentId,
                    isDeleted: false
                },
                {
                    $set: {
                        isDeleted: true,
                        deletedAt: new Date(),
                        deletedByParent: true
                    }
                },
                {
                    session
                }
            );

            deletedFiles += deletedDocs.modifiedCount;

            const candidateFolders = await Folder.find(
                {
                    parentFolderId: parentId,
                    isDeleted: false
                },
                null,
                {
                    session
                }
            ).lean();

            for (const candidate of candidateFolders) {

                const claimed = await Folder.findOneAndUpdate(
                    {
                        _id: candidate._id,
                        isDeleted: false
                    },
                    {
                        $set: {
                            isDeleted: true,
                            deletedAt: new Date(),
                            deletedByParent: true
                        }
                    },
                    {
                        new: true,
                        session
                    }
                );

                if (!claimed) {
                    continue;
                }

                deletedFolders++;

                await softDeleteChild(claimed._id);
            }
        }

        await softDeleteChild(rootFolder._id);

        await Storage.findOneAndUpdate(
            {
                tenantId
            },
            {
                $inc: {
                    totalFolders: -deletedFolders,
                    totalFiles: -deletedFiles,
                    trashedFiles: deletedFiles
                },
                $set: {
                    lastStorageUpdatedAt: new Date()
                }
            },
            {
                session
            }
        );

        return rootFolder;
    });

    emitToTenant(tenantId, FOLDER_TRASHED);

    return folder;
};