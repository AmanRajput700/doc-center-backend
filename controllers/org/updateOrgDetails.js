const Tenant = require('../../models/root/Tenant');
const getTenantModel = require('../../utils/getTenantModel');
const userSchema = require('../../models/tenant/userSchema');
const createHttpError = require('http-errors');
const { STATUS_CODE, ERROR_MESSAGE } = require('../../utils/constant');

module.exports = async function (orgData, user, tenant) {
    const User = getTenantModel(tenant.dbName, 'User', userSchema);
    const { orgname, orgSlogan, logoKey: logo } = orgData;
    const userExists = await User.findOne({ email: user.email }).populate('role', 'name').lean();
    if (!userExists || !userExists.role || userExists.role.name !== 'Admin') {
        throw new createHttpError(STATUS_CODE.FORBIDDEN, 'User not allowed to update details');
    }

    return await Tenant.findByIdAndUpdate(tenant._id, { orgname, orgSlogan, logo }, { new: true });
};