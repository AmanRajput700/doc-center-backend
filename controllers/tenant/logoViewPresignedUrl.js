const { generateGetObjectUrl } = require('../../services/s3.service.js');
const createHttpError = require('http-errors');
const { STATUS_CODE, ERROR_MESSAGE } = require('../../utils/constant');
const Tenant = require('../../models/root/Tenant.js');

module.exports = async function (slug) {
    const tenant = await Tenant.findOne({ slug });
    if (!tenant) throw new createHttpError(STATUS_CODE.BAD_REQUEST, ERROR_MESSAGE.INVALID_SLUG);

    const url = await generateGetObjectUrl(tenant.logo);
    return url;
};