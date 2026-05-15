const mongoose = require('mongoose');
const redis = require('../../services/cache');
const userSchema = require('../../models/tenant/userSchema');

module.exports = async function (dbName) {
    const tenantDB = mongoose.connection.useDb(dbName);
    const User = tenantDB.models.User || tenantDB.model('User', userSchema);
    const users = await redis.get(`user:${dbName}`);
    if (users) return JSON.parse(users);
    const dbUsers = await User.find({}, { _id: 1, firstName: 1, lastName: 1, email: 1, role: 1, status: 1, lastLogin: 1, lastActivateAt: 1 }).lean();
    await redis.set('user:all', JSON.stringify(dbUsers), "EX", 300);
    return dbUsers;
}