const mongoose = require('mongoose');
const roleSchema = require('../../models/tenant/roleSchema');
const redis = require('../../services/cache');

module.exports = async function (tenant) {
    const tenantDB = mongoose.connection.useDb(tenant.dbName);
    const Role = tenantDB.models.Role || tenantDB.model('Role', roleSchema);

    const roles = await redis.get(`roles:${tenant.dbName}`);
    if (roles) return JSON.parse(roles);

    const dbRoles = await Role.find({}).lean();
    await redis.set(`roles:${tenant.dbName}`, JSON.stringify(dbRoles), "EX", 300);
    return dbRoles;
}