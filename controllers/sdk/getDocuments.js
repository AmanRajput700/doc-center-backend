const getTenantModel = require('../../utils/getTenantModel');
const documentSchema = require('../../models/tenant/documentSchema');

module.exports = async function (tenant, queryData) {

    const Document = getTenantModel(tenant.dbName, 'Document', documentSchema);
    const { folderId } = queryData;

    const filter = {
        isDeleted: false,
        uploadStatus: 'uploaded'
    };

    if (!folderId || folderId === 'root') {
        filter.folderId = null;
    } else {
        filter.folderId = folderId;
    }

    const documents = await Document.find(filter)
        .populate(
            'uploadedBy',
            'firstName lastName email'
        )
        .sort({
            createdAt: -1
        })
        .lean();

    return documents;
};