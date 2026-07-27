const createHttpError = require('http-errors');

const getTenantModel = require('../../utils/getTenantModel');
const withTransaction = require('../../utils/withTransaction');

const Tenant = require('../../models/root/Tenant');
const documentSchema = require('../../models/tenant/documentSchema');
const notificationPreferenceSchema = require('../../models/tenant/notificationPreferenceSchema');
const storageSchema = require('../../models/tenant/storageSchema');

const { STATUS_CODE, ERROR_MESSAGE } = require('../../utils/constant');
const { addEmailJob } = require('../../queues/producers/emailProducers');
const { createNotification } = require('../../services/notificationService');
const { emitToTenant } = require('../../socket/services/emitService');
const { DOCUMENT_UPLOADED } = require('../../socket/constants/events');
const { updateApiAnalytics } = require('../../services/analyticsService');

module.exports = async function (apiKey, data) {

    if (apiKey !== process.env.EVENTBRIDGE_SECRET) throw new createHttpError(STATUS_CODE.UNAUTHORIZED, ERROR_MESSAGE.INVALID_API_KEY);

    const slug = data.detail.object.key.split('/')[1];
    const s3Key = data.detail.object.key;

    const tenant = await Tenant.findOne({ slug });
    if (!tenant) throw new createHttpError(STATUS_CODE.NOT_FOUND, 'Tenant not found');

    const Document = getTenantModel(tenant.dbName, 'Document', documentSchema);
    const Storage = getTenantModel(tenant.dbName, 'Storage', storageSchema);
    const NotificationPreference = getTenantModel(tenant.dbName, 'NotificationPreference', notificationPreferenceSchema);

    const { document, storage } = await withTransaction(async (session) => {

        const uploadedDocument = await Document.findOne(
            {
                s3Key
            },

        )
            .populate('uploadedBy', 'firstName lastName email');

        if (!uploadedDocument) {
            throw new createHttpError(
                STATUS_CODE.NOT_FOUND,
                ERROR_MESSAGE.DOC_NOT_FOUND
            );
        }

        const updatedStorage = await Storage.findOneAndUpdate(
            {
                tenantId: tenant._id
            },
            {
                $inc: {
                    totalFiles: 1,
                    storageUsed: data.detail.object.size
                },
                $set: {
                    lastStorageUpdatedAt: new Date()
                }
            },
            {
                new: true,
                session
            }
        ).lean();

        return {
            document: uploadedDocument.toObject(),
            storage: updatedStorage
        };
    });

    await updateApiAnalytics({
        dbName: tenant.dbName,
        set: {
            storageUsed: storage.storageUsed
        }
    });

    const preference = await NotificationPreference.findOne({
        userId: document.uploadedBy._id,
        tenantId: tenant._id,
        'emailNotifications.emailOnUpload': true
    }).lean();

    if (preference) {

        await addEmailJob('doc-upload', {
            firstName: document.uploadedBy.firstName,
            lastName: document.uploadedBy.lastName,
            orgName: tenant.orgName,
            email: document.uploadedBy.email,
            uploadDate: document.createdAt,
            documents: [document]
        });

    }

    await createNotification({
        tenant,
        userId: document.uploadedBy._id,
        title: 'Document Uploaded',
        message: `${document.originalFileName} uploaded successfully`,
        type: 'SUCCESS',
        metadata: {
            docId: document._id
        },
        createdBy: document.uploadedBy
    });

    emitToTenant(tenant._id, DOCUMENT_UPLOADED);
    return document;
};