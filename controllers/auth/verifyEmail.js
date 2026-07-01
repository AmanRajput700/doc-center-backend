const TenantUserMap = require('../../models/root/TenantUserMap');
const createHttpError = require('http-errors');
const { ERROR_MESSAGE, STATUS_CODE } = require('../../utils/constant');
const jwt = require('jsonwebtoken');

module.exports = async function (email) {
    const tenant = await TenantUserMap.findOne({ email }).populate("tenantId", "slug");
    if (!tenant) throw new createHttpError(STATUS_CODE.NOT_FOUND, ERROR_MESSAGE.USER_NOT_FOUND);

    return { slug: tenant.tenantId.slug };
};