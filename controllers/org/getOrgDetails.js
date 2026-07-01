const createHttpError = require('http-errors');
const TenantUserMap = require('../../models/root/TenantUserMap');
const userSchema = require('../../models/tenant/userSchema');
const { STATUS_CODE, ERROR_MESSAGE } = require('../../utils/constant');
const getTenantModel = require('../../utils/getTenantModel');

module.exports = async function (userId, dbName) {
    const User = getTenantModel(dbName, 'User', userSchema);
    const user = await User.findById(userId);
    if (!user) throw new createHttpError(STATUS_CODE.NOT_FOUND, ERROR_MESSAGE.USER_NOT_FOUND);

    const mapping = await TenantUserMap.findOne({ email: user.email }).populate('tenantId');
    if (!mapping) throw new createHttpError(STATUS_CODE.BAD_REQUEST, ERROR_MESSAGE.INVALID_USER);

    const memberCount = await User.countDocuments();
    return {
        orgName: mapping.tenantId.orgName,
        slug: mapping.tenantId.slug,
        createdAt: mapping.tenantId.createdAt,
        memberCount,
        currentPlan: mapping.tenantId.plan || 'Free',
        orgSlogan: mapping.tenantId.orgSlogan || '',
        logo: mapping.tenantId.logo || null
    };
}   