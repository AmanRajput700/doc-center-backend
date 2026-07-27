const createHttpError = require('http-errors');

const documentSchema = require('../../models/tenant/documentSchema');
const getTenantModel = require('../../utils/getTenantModel');

const { listMultipartUploadedParts } = require('../../services/s3.service');

const { STATUS_CODE, ERROR_MESSAGE } = require('../../utils/constant');

module.exports = async function (tenant, documentId) {

    const Document = getTenantModel(tenant.dbName, 'Document', documentSchema);

    const document = await Document.findById(documentId);
    if (!document) {
        throw new createHttpError(STATUS_CODE.NOT_FOUND, ERROR_MESSAGE.DOC_NOT_FOUND);


        if (!document.multipartUpload?.uploadId) {
            throw new createHttpError(
                STATUS_CODE.BAD_REQUEST,
                'Multipart upload not initiated.'
            );
        }

        const uploadedParts = await listMultipartUploadedParts(
            document.s3Key,
            document.multipartUpload.uploadId
        );

        return {
            documentId: document._id,
            uploadId: document.multipartUpload.uploadId,
            chunkSize: document.multipartUpload.chunkSize,
            totalParts: document.multipartUpload.totalParts,
            uploadedParts
        };
    };
}