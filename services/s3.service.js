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
        // { expiresIn: Number(process.env.UPLOAD_URL_EXPIRY) }
    );

    return url;
}

async function generateGetObjectUrl(key) {
    const commmand = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
        ResponseContentDisposition: 'inline'
    });
    const url = await getSignedUrl(s3Client, commmand);
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
        // {expiresIn: EXPIRY}
    );
    return url;
}

module.exports = {
    generateUploadUrl,
    generateGetObjectUrl,
    generateDownloadObjectUrl
};