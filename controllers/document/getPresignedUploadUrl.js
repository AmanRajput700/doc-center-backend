const generateS3Key = require('../../utils/generateS3Key');
const { generateUploadUrl } = require('../../services/s3.service');
const documentSchema = require('../../models/tenant/documentSchema');
const getTenantModel = require('../../utils/getTenantModel');
const path = require('node:path');
const redis = require('../../services/cache');

module.exports = async function (tenant, fileData, userId) {
    const { fileName, contentType, folderId = null, size } = fileData;
    const { slug: tenantSlug, dbName, _id: tenantId } = tenant;

    const key = generateS3Key(tenantSlug, fileName);
    const url = await generateUploadUrl(key, contentType);

    const storedName = path.basename(key);

    const Document = getTenantModel(dbName, 'Document', documentSchema);

    const document = await Document.create({
        tenantId,
        originalFileName: fileName,
        storedName,
        folderId,
        uploadedBy: userId,
        size,
        mimeType: contentType,
        s3Key: key,
        storageProvide: 's3',
        uploadStatus: 'pending'
    });

    await redis.del(`Document:${dbName}:${folderId || 'root'}`);
    return { documentId: document._id, url, key };
};