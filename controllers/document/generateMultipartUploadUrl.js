const { generateMultipartUploadUrl } = require("../../services/s3.service");
const documentSchema = require("../../models/tenant/documentSchema");
const getTenantModel = require("../../utils/getTenantModel");
const { STATUS_CODE, ERROR_MESSAGE } = require('../../utils/constant');
const createHttpError = require('http-errors');

const BATCH_SIZE = 5;

module.exports = async function (tenant, docData) {

    const { documentId, startPart = 1 } = docData;

    const Document = getTenantModel(tenant.dbName, "Document", documentSchema);
    const document = await Document.findById(documentId);

    if (!document) throw new createHttpError(STATUS_CODE.NOT_FOUND,ERROR_MESSAGE.DOC_NOT_FOUND);
    
    if (!document.multipartUpload?.uploadId) {
        throw new createHttpError(
            STATUS_CODE.BAD_REQUEST,
            "Multipart upload not initiated."
        );
    }

    const { uploadId, chunkSize, totalParts } = document.multipartUpload;

    if (startPart < 1 || startPart > totalParts) {
        throw new createHttpError(
            STATUS_CODE.BAD_REQUEST,
            "Invalid start part."
        );
    }

    const endPart = Math.min(startPart + BATCH_SIZE - 1, totalParts);

    const urls = await Promise.all(

        Array.from(
            {
                length: endPart - startPart + 1
            },
            (_, index) => {

                const partNumber = startPart + index;

                return generateMultipartUploadUrl(
                    document.s3Key,
                    uploadId,
                    partNumber
                ).then(url => ({
                    partNumber,
                    url
                }));

            }
        )

    );

    return {
        uploadId,
        chunkSize,
        totalParts,
        startPart,
        endPart,
        hasMore: endPart < totalParts,
        urls
    };

};