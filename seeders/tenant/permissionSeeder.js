const permissionSchema = require('../../models/tenant/permissionSchema');

module.exports = async function (tenantDB) {
    const Permission = tenantDB.models.Permission || tenantDB.model('Permission', permissionSchema);

    const permissions = [
        {
            name: 'upload_document',
            description: 'Can upload documents',
            module: 'Document'
        },
        {
            name: 'view_document',
            description: 'Can view documents',
            module: 'Document'
        },
        {
            name: 'update_document',
            description: 'Can update documents',
            module: 'Document'
        },
        {
            name: 'delete_document',
            description: 'Can delete documents',
            module: 'Document'
        },
        {
            name: 'download_document',
            description: 'Can download documents',
            module: 'Document'
        },
        {
            name: 'share_document',
            description: 'Can share documents',
            module: 'Document'
        }
    ];

    for (const permission of permissions) {
        const isPermissionExists = await Permission.findOne({ name: permission.name });
        if (!isPermissionExists) await Permission.create(permission);
    }
}