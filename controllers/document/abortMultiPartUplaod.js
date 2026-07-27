const createHttpError = require("http-errors");

const getTenantModel = require("../../utils/getTenantModel");
const withTransaction = require("../../utils/withTransaction");

const { abortMultipartUpload } = require("../../services/s3.service");

const documentSchema = require("../../models/tenant/documentSchema");

const { STATUS_CODE, ERROR_MESSAGE } = require("../../utils/constant");

module.exports = async function (tenant, data) {

    const { docId } = data;

    const Document = getTenantModel(tenant.dbName, "Document", documentSchema);

    const document = await Document.findById(docId);

    if (!document) throw new createHttpError(STATUS_CODE.NOT_FOUND, ERROR_MESSAGE.DOC_NOT_FOUND);
    

    if (!document.multipartUpload?.uploadId) {
        throw new createHttpError(STATUS_CODE.BAD_REQUEST, "Multipart upload not found.");
    }
    await abortMultipartUpload(document.s3Key, document.multipartUpload.uploadId);

    await withTransaction(async (session) => {
        document.uploadStatus = "failed";
        document.multipartUpload = undefined;
        await document.save({ session });
    });

    return {
        success: true,
        message: "Multipart upload aborted successfully."
    };
};