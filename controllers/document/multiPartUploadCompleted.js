const createHttpError = require('http-errors');

const getTenantModel = require('../../utils/getTenantModel');
const withTransaction = require('../../utils/withTransaction');

const { completeMultipartUpload } = require('../../services/s3.service');
const { updateApiAnalytics } = require('../../services/analyticsService');
const { createNotification } = require('../../services/notificationService');

const { addEmailJob } = require('../../queues/producers/emailProducers');

const { emitToTenant } = require('../../socket/services/emitService');
const { DOCUMENT_UPLOADED } = require('../../socket/constants/events');

const documentSchema = require('../../models/tenant/documentSchema');
const notificationPreferenceSchema = require('../../models/tenant/notificationPreferenceSchema');

const { STATUS_CODE, ERROR_MESSAGE } = require('../../utils/constant');

module.exports = async function (tenant, data) {

    const { documentId, parts } = data;

    const Document = getTenantModel(tenant.dbName, 'Document', documentSchema);

    const NotificationPreference = getTenantModel(tenant.dbName, 'NotificationPreference', notificationPreferenceSchema);

    const document = await Document.findById(documentId)
        .populate('uploadedBy', 'firstName lastName email');

    if (!document) {
        throw new createHttpError(
            STATUS_CODE.NOT_FOUND,
            ERROR_MESSAGE.DOC_NOT_FOUND
        );
    }

    if (!document.multipartUpload?.uploadId) {
        throw new createHttpError(
            STATUS_CODE.BAD_REQUEST,
            'Multipart upload not initiated.'
        );
    }

    if (!Array.isArray(parts) || parts.length === 0) {
        throw new createHttpError(
            STATUS_CODE.BAD_REQUEST,
            'Parts are required.'
        );
    }

    if (parts.length !== document.multipartUpload.totalParts) {
        throw new createHttpError(
            STATUS_CODE.BAD_REQUEST,
            `Expected ${document.multipartUpload.totalParts} parts but received ${parts.length}.`
        );
    }

    parts.sort((a, b) => a.PartNumber - b.PartNumber);

    // Complete upload in S3
    await completeMultipartUpload(
        document.s3Key,
        document.multipartUpload.uploadId,
        parts
    );

    // Mark document as uploaded
    const updatedDocument = await withTransaction(async (session) => {
        document.uploadStatus = 'uploaded';
        document.multipartUpload = undefined;
        await document.save({ session });
        return document.toObject();
    });

    // Calculate current storage usage
    const [storageStats] = await Document.aggregate([
        {
            $match: {
                isDeleted: false,
                uploadStatus: 'uploaded'
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

    await updateApiAnalytics({
        dbName: tenant.dbName,
        set: {
            storageUsed: storageStats?.storageUsed || 0
        }
    });

    // Email notification
    const preference = await NotificationPreference.findOne({
        userId: updatedDocument.uploadedBy._id,
        tenantId: tenant._id,
        'emailNotifications.emailOnUpload': true
    }).lean();

    if (preference) {

        await addEmailJob('doc-upload', {
            firstName: updatedDocument.uploadedBy.firstName,
            lastName: updatedDocument.uploadedBy.lastName,
            orgName: tenant.orgName,
            email: updatedDocument.uploadedBy.email,
            uploadDate: updatedDocument.createdAt,
            documents: [updatedDocument]
        });

    }

    // In-app notification
    await createNotification({
        tenant,
        userId: updatedDocument.uploadedBy._id,
        title: 'Document Uploaded',
        message: `${updatedDocument.originalFileName} uploaded successfully`,
        type: 'SUCCESS',
        metadata: {
            docId: updatedDocument._id
        },
        createdBy: updatedDocument.uploadedBy
    });

    emitToTenant(
        tenant._id,
        DOCUMENT_UPLOADED
    );

    return {
        success: true,
        documentId: updatedDocument._id
    };

};