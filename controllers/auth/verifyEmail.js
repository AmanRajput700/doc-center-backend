const TenantUserMap = require('../../models/root/TenantUserMap');
const createHttpError = require('http-errors');
const ERROR_MESSAGE = require('../../utils/constant');

module.exports = async function (email) {
    const tenant = await TenantUserMap.findOne({ email }).populate("tenantId", "slug");
    if (!tenant) throw new createHttpError(createHttpError.NotFound, ERROR_MESSAGE.USER_NOT_FOUND);
    return tenant.tenantId.slug;
};