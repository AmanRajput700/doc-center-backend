const { GetObjectCommand,
    PutObjectCommand,
    DeleteObjectCommand,
    CreateMultipartUploadCommand,
    UploadPartCommand,
    CompleteMultipartUploadCommand,
    AbortMultipartUploadCommand,
    ListPartsCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const s3Client = require('../config/s3Client.config');
const TIME = require('../utils/times');

async function generateUploadUrl(key, contentType) {

    const command = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
        ContentType: contentType
    });

    const url = await getSignedUrl(
        s3Client,
        command,
        {
            expiresIn: TIME.AWS_PUT_OBJECT_URI_EXPIRY
        }
    );

    return url;
}

async function generateGetObjectUrl(key, time = TIME.AWS_GET_OBJECT_URI_EXPIRY) {
    const command = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
    });
    const url = await getSignedUrl(
        s3Client,
        command,
        {
            expiresIn: time
        }
    );
    return url;
}

async function generateDownloadObjectUrl(key, fileName = 'download') {

    const command = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
        ResponseContentDisposition: `attachment; filename="${fileName}"`
    });

    const url = await getSignedUrl(
        s3Client,
        command,
        {
            expiresIn: TIME.AWS_DOWNLOAD_OBJECT_URI_EXPIRY
        }
    );
    return url;
}

async function deleteObject(key) {

    const command = new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key
    });

    return await s3Client.send(command);
}

async function initiateMultipartUpload(key, contentType) {

    const command = new CreateMultipartUploadCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
        ContentType: contentType
    });

    return await s3Client.send(command);
}

async function generateMultipartUploadUrl(key, uploadId, partNumber) {

    const command = new UploadPartCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
        UploadId: uploadId,
        PartNumber: partNumber
    });

    return await getSignedUrl(
        s3Client,
        command,
        {
            expiresIn: TIME.AWS_PUT_OBJECT_URI_EXPIRY
        }
    );
}

async function completeMultipartUpload(key, uploadId, parts) {

    const command = new CompleteMultipartUploadCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: {
            Parts: parts
        }
    });

    return await s3Client.send(command);
}

async function abortMultipartUpload(key, uploadId) {

    const command = new AbortMultipartUploadCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
        UploadId: uploadId
    });

    return await s3Client.send(command);
}

async function listMultipartUploadedParts(key, uploadId) {

    const command = new ListPartsCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
        UploadId: uploadId
    });

    const response = await s3.send(command);

    return response.Parts || [];

}

async function abortMultipartUpload(key, uploadId) {
    await s3Client.send(
        new AbortMultipartUploadCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
            UploadId: uploadId
        })
    );
}

module.exports = {
    generateUploadUrl,
    generateGetObjectUrl,
    generateDownloadObjectUrl,
    deleteObject,

    initiateMultipartUpload,
    generateMultipartUploadUrl,
    completeMultipartUpload,
    abortMultipartUpload,
    listMultipartUploadedParts
};