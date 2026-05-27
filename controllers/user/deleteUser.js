const userSchema = require('../../models/tenant/userSchema');
const { STATUS_CODE, ERROR_MESSAGE } = require('../../utils/constant');
const createHttpError = require('http-errors');
const getTenantModel = require('../../utils/getTenantModel');
const redis = require('../../services/cache');
const TenantUserMap = require('../../models/root/TenantUserMap');
const inviteMemberSchema = require('../../models/tenant/inviteMemberSchema');

module.exports = async function (userId, dbName) {
    const User = getTenantModel(dbName, 'User', userSchema);
    const InviteMember = getTenantModel(dbName, 'InviteMember', inviteMemberSchema);

    const deletedUser = await User.findOneAndDelete({ _id: userId, role: { $ne: 'Admin' } });
    if (!deletedUser) throw new createHttpError(STATUS_CODE.NOT_FOUND, ERROR_MESSAGE.USER_NOT_FOUND);
    await TenantUserMap.deleteOne({ email: deletedUser.email });
    await InviteMember.deleteOne({ email: deletedUser.email });
    await redis.del(`user:${dbName}`);
    return deletedUser;
}