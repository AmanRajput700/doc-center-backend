const permissionSchema = require('../../models/tenant/permissionSchema');
const getTenantModel = require('../../utils/getTenantModel');

module.exports = async function (dbName) {
    const Permission = getTenantModel(dbName, 'Permission', permissionSchema);
    const permissionCatalog = await Permission.aggregate([
        {
            $group: {
                _id: '$module',
                permissions: {
                    $push: {
                        permissionId: '$_id',
                        name: '$displayName'
                    }
                },
                totalCount: {
                    $sum: 1
                }
            }
        },
        {
            $project: {
                _id: 0,
                module: '$_id',
                permissions: 1,
                totalCount: 1
            }
        },
        {
            $sort: {
                module: 1
            }
        }
    ])
    return permissionCatalog;
}