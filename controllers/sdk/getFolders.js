const getTenantModel = require('../../utils/getTenantModel');
const folderSchema = require('../../models/tenant/folderSchema');

module.exports = async function (tenant, queryData) {

    const { parentFolderId } = queryData;
    const Folder = getTenantModel(tenant.dbName, 'Folder', folderSchema);

    const filter = { isDeleted: false };

    if (parentFolderId && parentFolderId !== 'root') {
        filter.parentFolderId = parentFolderId;
    } else {
        filter.parentFolderId = null;
    }

    const folders = await Folder.find(filter)
        .sort({
            createdAt: -1
        })
        .lean();

    return folders;
};