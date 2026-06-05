const getTenantModel = require('../../utils/getTenantModel');
const roleSchema = require('../../models/tenant/roleSchema');
const permissionSchema = require('../../models/tenant/permissionSchema');
const redis = require('../../services/cache');
const parseBoolean = require('../../utils/parseBoolean');


module.exports = async function (tenant, adminFlag) {
    const Role = getTenantModel(tenant.dbName, 'Role', roleSchema);
    const Permission = getTenantModel(tenant.dbName, 'Permission', permissionSchema);
    const cacheKey = `roles:${tenant.dbName}:${adminFlag}`;

    const roles = await redis.get(`roles:${tenant.dbName}`);
    if (roles) return JSON.parse(roles);

    let pipeline = [];

    if (!parseBoolean(adminFlag)) {
        pipeline.push({
            $match: {
                isSystemRole: false
            }
        });
    }

    pipeline.push(
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
    );

    let dbRoles = await Role.aggregate(pipeline);

    // for extra idea how to populate aggregated res
    // dbRoles = await Role.populate(dbRoles, {
    //     path: 'permissions',
    //     select: 'displayName'
    // });

    await redis.set(cacheKey, JSON.stringify(dbRoles), "EX", 300);
    return dbRoles;
}