const createHttpError = require('http-errors');

const getTenantModel = require('../../utils/getTenantModel');
const withTransaction = require('../../utils/withTransaction');

const folderSchema = require('../../models/tenant/folderSchema');
const documentSchema = require('../../models/tenant/documentSchema');

const { STATUS_CODE, ERROR_MESSAGE } = require('../../utils/constant');
const { emitToTenant } = require('../../socket/services/emitService');
const { FOLDER_RESTORED } = require('../../socket/constants/events');

const RETENTION_WINDOW_MS = 1000 * 60 * 60 * 24 * 7;

module.exports = async function (folderId, tenant) {

    const { dbName, _id: tenantId } = tenant;

    const Folder = getTenantModel(dbName, 'Folder', folderSchema);
    const Document = getTenantModel(dbName, 'Document', documentSchema);

    const cutoff = new Date(Date.now() - RETENTION_WINDOW_MS);

    const restoredFolder = await withTransaction(async (session) => {

        const folder = await Folder.findOneAndUpdate(
            {
                _id: folderId,
                isDeleted: true,
                deletedAt: { $gte: cutoff }
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

        if (!folder) {
            throw new createHttpError(
                STATUS_CODE.NOT_FOUND,
                ERROR_MESSAGE.FOLDER_NOT_FOUND
            );
        }

        async function restoreChildren(parentId) {
            await Document.updateMany(
                {
                    folderId: parentId,
                    isDeleted: true,
                    deletedByParent: true,
                    deletedAt: { $gte: cutoff }
                },
                {
                    $set: {
                        isDeleted: false,
                        deletedAt: null,
                        deletedByParent: false
                    }
                },
                {
                    session
                }
            );

            const childFolders = await Folder.find(
                {
                    parentFolderId: parentId,
                    isDeleted: true,
                    deletedByParent: true,
                    deletedAt: { $gte: cutoff }
                },
                null,
                {
                    session
                }
            ).lean();

            for (const child of childFolders) {

                const restoredChild = await Folder.findOneAndUpdate(
                    {
                        _id: child._id,
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

                if (!restoredChild) continue;

                await restoreChildren(restoredChild._id);
            }
        }
        await restoreChildren(folder._id);
        return folder;
    });

    emitToTenant(tenantId, FOLDER_RESTORED);

    return restoredFolder;
};