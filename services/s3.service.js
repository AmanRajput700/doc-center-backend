const { PutObjectCommand } = require('@aws-sdk/client-s3');
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

module.exports = {
    generateUploadUrl
};