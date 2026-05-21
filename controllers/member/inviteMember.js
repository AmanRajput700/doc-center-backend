const { default: mongoose } = require('mongoose');
const inviteMemberSchema = require('../../models/tenant/inviteMemberSchema');
const inviteMemberEmail = require('../../utils/emails/inviteMemberEmail');
const TenantUserMap = require('../../models/root/TenantUserMap');
const createHttpError = require('http-errors');
const { STATUS_CODE, ERROR_MESSAGE } = require('../../utils/constant');

module.exports = async function (invitedBy, userData, orgName, tenant) {
    const { email, message, role } = userData;
    if (email === invitedBy.email) throw new createHttpError(STATUS_CODE.CONFLICT, ERROR_MESSAGE.USER_ALREADY_EXISTS);

    const existingMember = await TenantUserMap.findOne({ email, tenantId: tenant._id });
    if (existingMember) {
        if (existingMember.status === 'active') {
            throw new createHttpError(STATUS_CODE.CONFLICT, ERROR_MESSAGE.USER_ALREADY_EXISTS);
        }

        if (existingMember.status === 'pending') {
            throw new createHttpError(STATUS_CODE.CONFLICT, ERROR_MESSAGE.INVITE_ALREADY_SENT);
        }
    }
    const tenantDB = mongoose.connection.useDb(tenant.dbName);
    const InviteMember = tenantDB.models.InviteMember || tenantDB.model('InviteMember', inviteMemberSchema);
    const existingInvite = await InviteMember.findOne({ email });

    if (existingInvite) {
        throw new createHttpError(STATUS_CODE.CONFLICT, ERROR_MESSAGE.INVITE_ALREADY_SENT);
    }

    const inviteMember = await InviteMember.create({
        email,
        role,
        invitedBy: invitedBy._id
    });

    const token = inviteMember.generateInviteToken();
    await inviteMember.save();

    const inviteLink = `${process.env.FRONTEND_URL}/users/invite?token=${token}`;;
    await TenantUserMap.create({
        email,
        tenantId: tenant._id,
        status: 'pending'
    });
    await inviteMemberEmail(orgName, email, message, inviteLink);
}