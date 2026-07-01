const generateS3Key = require('../../utils/generateS3Key.js');
const { generateUploadUrl } = require('../../services/s3.service.js');
const createHttpError = require('http-errors');
const { STATUS_CODE, ERROR_MESSAGE } = require('../../utils/constant');

module.exports = async function (logoData) {
    const { slug, fileName, contentType } = logoData;

    if (!slug) throw new createHttpError(STATUS_CODE.BAD_REQUEST, 'Slug is required before uploading logo');

    const key = generateS3Key(slug, fileName);
    const url = await generateUploadUrl(key, contentType);

    return { key, url };
}