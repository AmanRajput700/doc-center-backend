const { GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const s3Client = require('../config/s3Client.config');

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
            expiresIn: 60 * 5
        }
    );

    return url;
}

async function generateGetObjectUrl(key) {
    const commmand = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
    });
    const url = await getSignedUrl(
        s3Client,
        commmand,
        {
            expiresIn: 60
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
            expiresIn: 60
        }
    );
    return url;
}

module.exports = {
    generateUploadUrl,
    generateGetObjectUrl,
    generateDownloadObjectUrl
};