const crypto = require('node:crypto');
const ApiKey = require('../../models/root/ApiKey');
const createHttpError = require('http-errors');
const { STATUS_CODE, ERROR_MESSAGE } = require('../../utils/constant');

module.exports = async function (rawApiKey) {

    if (!rawApiKey) throw new createHttpError(STATUS_CODE.UNAUTHORIZED, ERROR_MESSAGE.API_KEY_MISSING);

    const hashedApiKey = crypto.createHash('sha256').update(rawApiKey).digest('hex');

    const apiKey = await ApiKey.findOne({ key_hash: hashedApiKey })
        .populate(
            'tenantId',
            'slug dbName'
        );

    if (!apiKey) throw createHttpError(STATUS_CODE.UNAUTHORIZED, ERROR_MESSAGE.INVALID_API_KEY);

    return apiKey;

}