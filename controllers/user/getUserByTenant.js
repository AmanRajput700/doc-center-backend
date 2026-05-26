const getTenantModel = require('../../utils/getTenantModel');
const redis = require('../../services/cache');
const userSchema = require('../../models/tenant/userSchema');
const roleSchema = require('../../models/tenant/roleSchema');

module.exports = async function (dbName) {
    const User = getTenantModel(dbName, 'User', userSchema);
    const Role = getTenantModel(dbName, 'Role', roleSchema);
    const users = await redis.get(`user:${dbName}`);
    if (users) return JSON.parse(users);
    const dbUsers = await User.find({}, { _id: 1, firstName: 1, lastName: 1, email: 1, role: 1, status: 1, lastLogin: 1, lastActivateAt: 1 }).populate('role', 'name').lean();
    await redis.set(`user:${dbName}`, JSON.stringify(dbUsers), "EX", 300);
    return dbUsers;
}