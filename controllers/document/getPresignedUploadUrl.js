const generateS3Key = require('../../utils/generateS3Key');
const { generateUploadUrl } = require('../../services/s3.service');
const documentSchema = require('../../models/tenant/documentSchema');
const storageSchema = require('../../models/tenant/storageSchema');
const getTenantModel = require('../../utils/getTenantModel');
const path = require('node:path');
const plans = require('../../config/plans');
const createHttpError = require('http-errors');
const { STATUS_CODE, ERROR_MESSAGE } = require('../../utils/constant');
const checkStorageThreshold = require('../../helper/storage/checkStorageThreshold');

module.exports = async function (tenant, fileData, userId) {
    let { fileName, contentType, folderId = 'root', size } = fileData;
    const { slug: tenantSlug, dbName, _id: tenantId } = tenant;

    if (!folderId || folderId === 'root') {
        folderId = undefined;
    }

    const ext = path.extname(fileName);
    const baseName = path.basename(fileName, ext);

    const Document = getTenantModel(dbName, 'Document', documentSchema);
    const Storage = getTenantModel(dbName, 'Storage', storageSchema);

    const pendingDocs = await Document.aggregate([
        { $match: { tenantId, uploadStatus: 'pending' } },
        { $group: { _id: null, totalSize: { $sum: '$size' } } }
    ]);
    const pendingSize = pendingDocs.length > 0 ? pendingDocs[0].totalSize : 0;

    const storage = await Storage.findOne({ tenantId }) || { storageUsed: 0 };

    const plan = plans[tenant.currentPlan];

    if ((storage.storageUsed + pendingSize + size) > plan.storageLimit) {
        throw new createHttpError(
            STATUS_CODE.FORBIDDEN,
            ERROR_MESSAGE.STORAGE_EXCEED
        );
    }

    // Escape regex special characters
    const escapedBase = baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedExt = ext.replace('.', '\\.');

    const existingDocs = await Document.find({
        originalFileName: {
            $regex: new RegExp(
                `^${escapedBase}(?:_(\\d+))?${escapedExt}$`,
                'i'
            )
        },
        folderId
    }).select('originalFileName');

    if (existingDocs.length > 0) {
        let maxVersion = 1;

        for (const doc of existingDocs) {
            const match = doc.originalFileName.match(/_(\d+)\.[^.]+$/);

            if (match) {
                maxVersion = Math.max(maxVersion, Number(match[1]));
            }
        }

        fileName = `${baseName}_${maxVersion + 1}${ext}`;
    }

    const key = generateS3Key(tenantSlug, fileName);
    const url = await generateUploadUrl(key, contentType);
    const storedName = path.basename(key);

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

    await checkStorageThreshold({
        tenant,
        storage,
        incomingSize: pendingSize + size,
        plan
    });

    return {
        documentId: document._id,
        url,
        key
    };
};