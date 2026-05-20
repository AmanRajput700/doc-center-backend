const roleSchema = require('../../models/tenant/roleSchema');
const permissionSchema = require('../../models/tenant/permissionSchema');

module.exports = async function (tenantDB) {
    const Role = tenantDB.models.Role || tenantDB.model('Role', roleSchema);

    const Permission = tenantDB.models.Permission || tenantDB.model('Permission', permissionSchema);

    const permissions = await Permission.find({}, { _id: 1 }).lean();

    const allPermissionIds = permissions.map(permission => permission._id);

    const isAdminRoleExists = await Role.findOne({ name: 'Admin' }).lean();
    let role;
    if (!isAdminRoleExists) {
        role = await Role.create({
            name: 'Admin',
            permissions: allPermissionIds,
            isSystemRole: true
        });
    }
    return role;
}