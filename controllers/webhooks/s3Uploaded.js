const createHttpError = require('http-errors');
const { STATUS_CODE, ERROR_MESSAGE, STORAGE_LIMIT } = require('../../utils/constant');
const getTenantModel = require('../../utils/getTenantModel');
const Tenant = require('../../models/root/Tenant');
const documentSchema = require('../../models/tenant/documentSchema');
const notificationPreferenceSchema = require('../../models/tenant/notificationPreferenceSchema');
const storageSchema = require('../../models/tenant/storageSchema');
const { addEmailJob } = require('../../queues/producers/emailProducers');
const { createNotification } = require('../../services/notificationService');
const { emitToUser, emitToTenant } = require('../../socket/services/emitService');
const { DOCUMENT_UPLOADED } = require('../../socket/constants/events');

module.exports = async function (apiKey, data) {

    if (apiKey !== process.env.EVENTBRIDGE_SECRET) {
        throw new createHttpError(STATUS_CODE.UNAUTHORIZED, ERROR_MESSAGE.INVALID_API_KEY);
    }

    const slug = data.detail.object.key.split('/')[1];
    const s3Key = data.detail.object.key;



    const tenant = await Tenant.findOne({ slug });
    const Document = getTenantModel(tenant.dbName, 'Document', documentSchema);
    const NotificationPreference = getTenantModel(tenant.dbName, 'NotificationPreference', notificationPreferenceSchema);
    const Storage = getTenantModel(tenant.dbName, 'Storage', storageSchema);


    const document = await Document.findOneAndUpdate(
        {
            s3Key,
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

    await Storage.findOneAndUpdate(
        {
            tenantId: tenant._id
        },
        {
            $inc: {
                totalFiles: 1,
                storageUsed: data.detail.object.size // or document.size which one will be better?
            },
            $set: {
                lastStorageUpdatedAt: new Date()
            }
        }
    );
    const preference = await NotificationPreference.findOne({
        userId: document.uploadedBy._id,
        tenantId: tenant._id,
        'emailNotifications.emailOnUpload': true
    }).lean();

    if (preference) {
        const Docdata = {
            firstName: document.uploadedBy.firstName,
            lastName: document.uploadedBy.lastName,
            orgName: tenant.orgName,
            email: document.uploadedBy.email,
            uploadDate: document.createdAt,
            documents: [document]
        };

        await addEmailJob('doc-upload', Docdata);
    }

    const notificationData = {
        tenant,
        userId: document.uploadedBy._id,
        title: "Document Uploaded",
        message: `${document.originalFileName} uploaded Succesfully`,
        type: 'SUCCESS',
        metadata: {
            docId: document._id
        },
        createdBy: document.uploadedBy
    };

    emitToTenant(tenant._id, DOCUMENT_UPLOADED);
    await createNotification(notificationData);
    return document;
}