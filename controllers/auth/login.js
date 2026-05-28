const TenantUserMap = require('../../models/root/TenantUserMap');
const createHttpError = require('http-errors');
const { ERROR_MESSAGE, STATUS_CODE } = require('../../utils/constant');
const Tenant = require('../../models/root/Tenant');
const getTenantModel = require('../../utils/getTenantModel');
const userSchema = require('../../models/tenant/userSchema');
const tokenGenrator = require('../../utils/tokenGenrator');
const jwt = require('jsonwebtoken');
const TIME = require('../../utils/times');
const roleSchema = require('../../models/tenant/roleSchema');

module.exports = async function (userData) {
    const { email, password, slug } = userData;
    const mapping = await TenantUserMap.findOne({ email }).populate("tenantId", "slug dbName");
    if (!mapping || mapping.tenantId.slug !== slug) throw new createHttpError(STATUS_CODE.NOT_FOUND, ERROR_MESSAGE.USER_NOT_FOUND);

    const Role = getTenantModel(mapping.tenantId.dbName, 'Role', roleSchema);
    const User = getTenantModel(mapping.tenantId.dbName, 'User', userSchema);
    const user = await User.findOne({ email }).populate('role', 'name').select("+password");
    if (!user) throw new createHttpError(STATUS_CODE.NOT_FOUND, ERROR_MESSAGE.USER_NOT_FOUND);

    if (user.lockUntil && user.lockUntil > Date.now()) {
        const remainingTime = Math.ceil((user.lockUntil - Date.now()) / (1000 * 60 * 60));
        throw new createHttpError(STATUS_CODE.FORBIDDEN, `Account locked In try again after ${remainingTime} hours`);
    }

    const isValidUser = await user.comparePassword(password);
    if (!isValidUser) {
        user.failedLogInAttempts = (user.failedLogInAttempts || 0) + 1;;
        if (user.failedLogInAttempts >= TIME.MAX_LOGIN_ATTEMPTS) {
            user.lockUntil = Date.now() + 1000 * 60 * 60 * 24;
        }
        await user.save();
        throw new createHttpError(STATUS_CODE.UNAUTHORIZED, user.failedLogInAttempts >= TIME.MAX_LOGIN_ATTEMPTS ? 'User account locked for 24 hours' : `Invalid credentials Attempts Left ${TIME.MAX_LOGIN_ATTEMPTS - user.failedLogInAttempts}`);
    }
    const { refreshToken, accessToken } = await tokenGenrator(User, user._id, mapping);
    user.failedLogInAttempts = 0;
    user.lockUntil = undefined;
    user.lastLogin = Date.now();
    await user.save();
    user.password = undefined;
    return {  refreshToken, accessToken };
}