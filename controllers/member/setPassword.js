const getTenantModel = require('../../utils/getTenantModel');
const TenantUserMap = require('../../models/root/TenantUserMap');
const userSchema = require('../../models/tenant/userSchema');
const inviteMemberSchema = require('../../models/tenant/inviteMemberSchema');
const crypto = require('node:crypto');
const createHttpError = require('http-errors');
const { ERROR_MESSAGE, STATUS_CODE } = require('../../utils/constant');
const jwt = require('jsonwebtoken');
const redis = require('../../services/cache');
const notificationPreferenceSeeder = require('../../seeders/tenant/notificationPrefrenceSeeder');

module.exports = async function (userData) {
    const { token, password, confirmPassword } = userData;
    if (password !== confirmPassword) throw new createHttpError(STATUS_CODE.CONFLICT, ERROR_MESSAGE.PASSWORD_MISMATCH);
    let decoded;

    try {
        decoded = jwt.verify(
            token,
            process.env.JWT_EMAIL_VERIFY_SECRET
        );
    } catch (err) {
        throw new createHttpError(STATUS_CODE.UNAUTHORIZED, ERROR_MESSAGE.INVALID_USER);
    }
    const email = decoded.email;

    const mapping = await TenantUserMap.findOne({ email, status: 'pending' }).populate('tenantId', 'dbName');
    if (!mapping) throw new createHttpError(STATUS_CODE.UNAUTHORIZED, ERROR_MESSAGE.INVALID_USER);

    const InviteMember = getTenantModel(mapping.tenantId.dbName, 'InviteMember', inviteMemberSchema);

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const validMember = await InviteMember.findOne({ inviteToken: hashedToken });
    if (!validMember) throw new createHttpError(STATUS_CODE.UNAUTHORIZED, ERROR_MESSAGE.INVALID_USER);
    const User = getTenantModel(mapping.tenantId.dbName, 'User', userSchema);

    const existingUser = await User.findOne({ email });
    if (existingUser) throw new createHttpError(STATUS_CODE.CONFLICT, ERROR_MESSAGE.USER_ALREADY_EXISTS);

    const user = await User.create({
        email,
        password,
        role: decoded.role
    });
    await notificationPreferenceSeeder(mapping.tenantId.dbName, user._id, mapping.tenantId._id)
    await TenantUserMap.updateOne({ email }, { $set: { status: 'active' } });
    await InviteMember.updateOne({ email }, { $set: { status: 'accepted' }, $unset: { inviteToken: 1 } });
    await redis.del(`user:${mapping.tenantId.dbName}`);
}