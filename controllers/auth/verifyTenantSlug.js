const createHttpError = require('http-errors');
const Tenant = require('../../models/root/Tenant');
const { STATUS_CODE, ERROR_MESSAGE } = require('../../utils/constant');

module.exports = async function (slug) {
    const tenant = await Tenant.findOne({ slug });
    if (!tenant) throw new createHttpError(STATUS_CODE.NOT_FOUND, ERROR_MESSAGE.TENANT_NOT_FOUND);
    return tenant;
}