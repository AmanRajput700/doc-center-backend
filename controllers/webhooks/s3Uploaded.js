const createHttpError = require('http-errors');
const { STATUS_CODE, ERROR_MESSAGE, STORAGE_LIMIT } = require('../../utils/constant');
const getTenantModel = require('../../utils/getTenantModel');
const Tenant = require('../../models/root/Tenant');
const documentSchema = require('../../models/tenant/documentSchema');

module.exports = async function (apiKey, data) {

    if (apiKey !== process.env.EVENTBRIDGE_SECRET) {
        throw new createHttpError(STATUS_CODE.UNAUTHORIZED, ERROR_MESSAGE.INVALID_API_KEY);
    }

    const slug = data.detail.object.key.split('/')[1];
    const s3Key = data.detail.object.key.split('/')[2];


    const tenant = await Tenant.findOne({ slug });
    const Document = getTenantModel(tenant.dbName, 'Document', documentSchema);

    const document = await findOne({ s3Key });


}