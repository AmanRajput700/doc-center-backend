const TenantUserMap = require('../../models/root/TenantUserMap');
const createHttpError = require('http-errors');
const ERROR_MESSAGE = require('../../utils/constant');
const Tenant = require('../../models/root/Tenant');
const mongoose = require('mongoose');
const userSchema = require('../../models/tenant/userSchema');
const tokenGenrator = require('../../utils/tokenGenrator');

module.exports = async function (userData) {
    const { email, password } = userData;
    const mapping = await TenantUserMap.findOne({ email }).populate("tenantId", "slug dbName");
    if (!mapping) throw new createHttpError(createHttpError.NotFound, ERROR_MESSAGE.USER_NOT_FOUND);

    const tenantDB = mongoose.connection.useDb(mapping.tenantId.dbName);
    const User = tenantDB.models.User || tenantDB.model('User', userSchema);
    const user = await User.findOne({ email }).select("+password");
    if (!user) throw new createHttpError(createHttpError.NotFound, ERROR_MESSAGE.USER_NOT_FOUND);
    const isValidUser = await user.comparePassword(password);
    if (!isValidUser) throw new createHttpError(createHttpError.Unauthorized, ERROR_MESSAGE.INVALID_CREDENTIALS);

    const { refreshToken, accessToken } = await tokenGenrator(User, user._id, mapping);
    user.password = undefined;
    return { user, slug: mapping.tenantId.slug, refreshToken, accessToken };
}