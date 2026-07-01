const { GetObjectCommand, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
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

module.exports = {
    generateUploadUrl,
    generateGetObjectUrl,
    generateDownloadObjectUrl,
    deleteObject
};