const generateS3Key = require('../../utils/generateS3Key');
const { generateUploadUrl } = require('../../services/s3.service');
const documentSchema = require('../../models/tenant/documentSchema');
const getTenantModel = require('../../utils/getTenantModel');
const path = require('node:path');
const redis = require('../../services/cache');

module.exports = async function (tenant, fileData, userId) {
    let { fileName, contentType, folderId = null, size } = fileData;
    const { slug: tenantSlug, dbName, _id: tenantId } = tenant;

    const ext = path.extname(fileName);
    const baseName = path.basename(fileName, ext);

    const key = generateS3Key(tenantSlug, fileName);
    const url = await generateUploadUrl(key, contentType);

    const storedName = path.basename(key);

    const Document = getTenantModel(dbName, 'Document', documentSchema);

    const existingDocs = await Document.find({
        originalFileName: new RegExp(`^${baseName}(_\\d+)?${ext}$`, 'i')
    }).sort({ createdAt: -1 });

    if (existingDocs.length > 0) {
        let maxVersion = 0;

        existingDocs.forEach(doc => {
            const match = doc.originalFileName.match(/_(\d+)\.[^.]+$/);

            if (match) {
                maxVersion = Math.max(maxVersion, parseInt(match[1], 10));
            } else {
                maxVersion = Math.max(maxVersion, 1);
            }
        });

        fileName = `${baseName}_${maxVersion + 1}${ext}`;
    }

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