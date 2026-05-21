const permissionSchema = require('../../models/tenant/permissionSchema');
const mongoose = require('mongoose');

module.exports = async function (dbName) {
    const tenantDB = mongoose.connection.useDb(dbName);

    const Permission = tenantDB.models.Permission || tenantDB.model('Permission', permissionSchema);
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
        }
    ])
    return permissionCatalog;
}