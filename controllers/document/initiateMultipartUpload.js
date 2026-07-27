const path = require('node:path');
const createHttpError = require('http-errors');

const generateS3Key = require('../../utils/generateS3Key');
const getTenantModel = require('../../utils/getTenantModel');
const getChunkSize = require('../../utils/getChunkSize');

const { initiateMultipartUpload } = require('../../services/s3.service');

const documentSchema = require('../../models/tenant/documentSchema');

const plans = require('../../config/plans');

const checkStorageThreshold = require('../../helper/storage/checkStorageThreshold');

const { STATUS_CODE, ERROR_MESSAGE } = require('../../utils/constant');

module.exports = async function (tenant, fileData, userId) {

    let {
        fileName,
        contentType,
        folderId = 'root',
        size
    } = fileData;

    const { slug: tenantSlug, dbName, _id: tenantId, currentPlan } = tenant;

    if (!folderId || folderId === 'root') {
        folderId = undefined;
    }

    const ext = path.extname(fileName);
    const baseName = path.basename(fileName, ext);

    const Document = getTenantModel(
        dbName,
        'Document',
        documentSchema
    );

    // Calculate current storage usage
    // Includes uploaded + pending files
    const [storageStats] = await Document.aggregate([
        {
            $match: {
                tenantId,
                isDeleted: false,
                uploadStatus: {
                    $in: ['uploaded', 'pending']
                }
            }
        },
        {
            $group: {
                _id: null,
                storageUsed: {
                    $sum: '$size'
                }
            }
        }
    ]);

    const storageUsed = storageStats?.storageUsed || 0;

    const plan = plans[currentPlan];

    if (storageUsed + size > plan.storageLimit) {
        throw new createHttpError(
            STATUS_CODE.FORBIDDEN,
            ERROR_MESSAGE.STORAGE_EXCEED
        );
    }

    // Prevent duplicate filenames
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
                maxVersion = Math.max(
                    maxVersion,
                    Number(match[1])
                );
            }
        }

        fileName = `${baseName}_${maxVersion + 1}${ext}`;
    }

    // Generate S3 key
    const key = generateS3Key(
        tenantSlug,
        fileName
    );

    const chunkSize = getChunkSize(size);
    const totalParts = Math.ceil(size / chunkSize);

    if (totalParts > 10000) {
        throw new createHttpError(
            STATUS_CODE.BAD_REQUEST,
            'File is too large to upload.'
        );
    }

    const multipartUpload = await initiateMultipartUpload(
        key,
        contentType
    );

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
        uploadStatus: 'pending',
        multipartUpload: {
            uploadId: multipartUpload.UploadId,
            chunkSize,
            totalParts,
            initiatedAt: new Date()
        }
    });

    await checkStorageThreshold({
        tenant,
        storageUsed,
        incomingSize: size,
        plan
    });

    return {
        documentId: document._id,
        uploadId: multipartUpload.UploadId,
        key,
        chunkSize,
        totalParts
    };
};