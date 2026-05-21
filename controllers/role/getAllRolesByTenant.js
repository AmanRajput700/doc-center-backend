const mongoose = require('mongoose');
const roleSchema = require('../../models/tenant/roleSchema');
const permissionSchema = require('../../models/tenant/permissionSchema');
const redis = require('../../services/cache');

module.exports = async function (tenant) {
    const tenantDB = mongoose.connection.useDb(tenant.dbName);
    const Role = tenantDB.models.Role || tenantDB.model('Role', roleSchema);
    const Permission = tenantDB.models.Permission || tenantDB.model('Permission', permissionSchema);

    const roles = await redis.get(`roles:${tenant.dbName}`);
    if (roles) return JSON.parse(roles);

    let dbRoles = await Role.aggregate([
        {
            $match: {
                isSystemRole: false
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: 'role',
                as: 'users'
            }
        },
        {
            $addFields: {
                totalUsers: {
                    $size: '$users'
                }
            }
        },
        {
            $project: {
                users: 0
            }
        }
    ]);

    // for extra idea how to populate aggregated res
    // dbRoles = await Role.populate(dbRoles, {
    //     path: 'permissions',
    //     select: 'displayName'
    // });

    await redis.set(`roles:${tenant.dbName}`, JSON.stringify(dbRoles), "EX", 300);
    return dbRoles;
}