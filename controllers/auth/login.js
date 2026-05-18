const TenantUserMap = require('../../models/root/TenantUserMap');
const createHttpError = require('http-errors');
const { ERROR_MESSAGE, STATUS_CODE } = require('../../utils/constant');
const Tenant = require('../../models/root/Tenant');
const mongoose = require('mongoose');
const userSchema = require('../../models/tenant/userSchema');
const tokenGenrator = require('../../utils/tokenGenrator');
const jwt = require('jsonwebtoken');
const TIME = require('../../utils/times');
const roleSchema = require('../../models/tenant/roleSchema');

module.exports = async function (userData) {
    const { emailVerifyToken, password, slug } = userData;
    const decoded = jwt.verify(emailVerifyToken, process.env.JWT_EMAIL_VERIFY_SECRET);
    const email = decoded.email;
    const mapping = await TenantUserMap.findOne({ email }).populate("tenantId", "slug dbName");
    if (!mapping || mapping.tenantId.slug !== slug) throw new createHttpError(STATUS_CODE.NOT_FOUND, ERROR_MESSAGE.USER_NOT_FOUND);

    const tenantDB = mongoose.connection.useDb(mapping.tenantId.dbName);
    const Role = tenantDB.models.Role || tenantDB.model('Role', roleSchema);
    const User = tenantDB.models.User || tenantDB.model('User', userSchema);
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
    return { user, slug: mapping.tenantId.slug, refreshToken, accessToken };
}