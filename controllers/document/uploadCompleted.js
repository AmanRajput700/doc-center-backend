const getTenantModel = require('../../utils/getTenantModel');
const documentSchema = require('../../models/tenant/documentSchema');
const createHttpError = require('http-errors');
const { STATUS_CODE, ERROR_MESSAGE } = require('../../utils/constant');
const storageSchema = require('../../models/tenant/storageSchema');
const docUploadedSuccessfullyEmail = require('../../utils/emails/docsUploadedEmail');
const notificationPreferenceSchema = require('../../models/tenant/notificationPreferenceSchema');
const { addEmailJob } = require('../../queues/producers/emailProducers');
const { createNotification } = require('../../services/notificationService');

module.exports = async function (documentId, tenant, user) {
    const { dbName, _id: tenantId } = tenant;
    const Document = getTenantModel(dbName, 'Document', documentSchema);
    const Storage = getTenantModel(dbName, 'Storage', storageSchema);
    const NotificationPreference = getTenantModel(dbName, 'NotificationPreference', notificationPreferenceSchema);

    const document = await Document.findOneAndUpdate(
        {
            _id: documentId,
            uploadStatus: 'pending'
        },
        {
            $set: {
                uploadStatus: 'uploaded'
            }
        },
        {
            returnDocument: 'after'
        }
    ).populate('uploadedBy', 'firstName lastName email')
        .lean();

    if (!document) throw new createHttpError(STATUS_CODE.NOT_FOUND, ERROR_MESSAGE.DOC_NOT_FOUND);

    const notificationData = {
        tenant,
        userId: user._id,
        title: "Document Uploaded",
        message: `${document.originalFileName} uploaded Succesfully`,
        type: 'SUCCESS',
        metadata: {
            docId: document._id
        },
        createdBy: document.uploadedBy
    };


    const notification = await NotificationPreference.findOne({ userId: document.uploadedBy._id, tenantId }).lean();
    if (!document) throw new createHttpError(STATUS_CODE.NOT_FOUND, ERROR_MESSAGE.DOC_NOT_FOUND);

    await Storage.findOneAndUpdate(
        {
            tenantId
        },
        {
            $inc: {
                totalFiles: 1,
                storageUsed: document.size
            },
            $set: {
                lastStorageUpdatedAt: new Date()
            }
        }
    );
    const Docdata = { firstName: document.uploadedBy.firstName, lastName: document.uploadedBy.lastName, orgName: tenant.orgName, email: document.uploadedBy.email, uploadDate: document.createdAt, documents: [document] };
    if (notification.emailNotifications.emailOnUpload) {
        await addEmailJob('doc-upload', Docdata);
    }

    await createNotification(notificationData);
    return document;
}