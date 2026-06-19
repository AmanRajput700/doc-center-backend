const getTenantModel = require('../../utils/getTenantModel');
const documentSchema = require('../../models/tenant/documentSchema');

module.exports = async function (tenant) {

    const Document = getTenantModel(tenant.dbName,'Document',documentSchema);

    const documents = await Document.find({
        isDeleted: false,
        uploadStatus: 'uploaded'
    })
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