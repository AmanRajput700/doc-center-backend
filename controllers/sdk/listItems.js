const getTenantModel = require('../../utils/getTenantModel');
const documentSchema = require('../../models/tenant/documentSchema');
const folderSchema = require('../../models/tenant/folderSchema');

module.exports = async function (tenant, queryData) {

    const { parentId } = queryData;

    const Document = getTenantModel(tenant.dbName,'Document',documentSchema);
    const Folder = getTenantModel(tenant.dbName,'Folder',folderSchema);

    const documentFilter = {
        isDeleted: false,
        uploadStatus: 'uploaded'
    };

    const folderFilter = {
        isDeleted: false
    };

    // Root Folder
    if (!parentId || parentId === 'root') {
        documentFilter.folderId = null;
        folderFilter.parentFolderId = null;
    } else {
        documentFilter.folderId = parentId;
        folderFilter.parentFolderId = parentId;
    }

    const [documents, folders] = await Promise.all([

        Document.find(documentFilter)
            .populate(
                'uploadedBy',
                'firstName lastName email'
            )
            .sort({
                createdAt: -1
            })
            .lean(),

        Folder.find(folderFilter)
            .populate(
                'createdBy',
                'firstName lastName email'
            )
            .sort({
                createdAt: -1
            })
            .lean()

    ]);

    const formattedFolders = folders.map(folder => ({
        ...folder,
        type: 'folder',
        name: folder.name
    }));

    const formattedDocuments = documents.map(document => ({
        ...document,
        type: 'document',
        name: document.originalFileName
    }));

    return [
        ...formattedFolders,
        ...formattedDocuments
    ];
};