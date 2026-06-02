const permissionSchema = require('../../models/tenant/permissionSchema');

module.exports = async function (tenantDB) {
    const Permission = tenantDB.models.Permission || tenantDB.model('Permission', permissionSchema);

    const permissions = [

        // DOCUMENT MODULE
        {
            name: 'upload_document',
            displayName: 'Upload Documents',
            description: 'Can upload documents',
            module: 'Document'
        },
        {
            name: 'view_document',
            displayName: 'View Documents',
            description: 'Can view documents',
            module: 'Document'
        },
        {
            name: 'update_document',
            displayName: 'Update Documents',
            description: 'Can update documents',
            module: 'Document'
        },
        {
            name: 'delete_document',
            displayName: 'Delete Documents',
            description: 'Can delete documents',
            module: 'Document'
        },
        {
            name: 'download_document',
            displayName: 'Download Documents',
            description: 'Can download documents',
            module: 'Document'
        },
        {
            name: 'share_document',
            displayName: 'Share Documents',
            description: 'Can share documents',
            module: 'Document'
        },
        {
            name: 'restore_document',
            displayName: 'Restore Documents',
            description: 'Can Restore Documents',
            module: 'Document'
        },

        // USER MODULE
        {
            name: 'view_user',
            displayName: 'View Users',
            description: 'Can view users',
            module: 'User'
        },
        {
            name: 'invite_user',
            displayName: 'Invite Users',
            description: 'Can invite users',
            module: 'User'
        },
        {
            name: 'update_user',
            displayName: 'Update Users',
            description: 'Can update users',
            module: 'User'
        },
        {
            name: 'delete_user',
            displayName: 'Delete Users',
            description: 'Can delete users',
            module: 'User'
        },
        {
            name: 'assign_role',
            displayName: 'Assign Roles',
            description: 'Can assign roles to users',
            module: 'User'
        },

        // ROLE MODULE
        {
            name: 'view_role',
            displayName: 'View Roles',
            description: 'Can view roles',
            module: 'Role'
        },
        {
            name: 'create_role',
            displayName: 'Create Roles',
            description: 'Can create roles',
            module: 'Role'
        },
        {
            name: 'update_role',
            displayName: 'Update Roles',
            description: 'Can update roles',
            module: 'Role'
        },
        {
            name: 'delete_role',
            displayName: 'Delete Roles',
            description: 'Can delete roles',
            module: 'Role'
        },
        {
            name: 'assign_permission',
            displayName: 'Assign Permissions',
            description: 'Can assign permissions to roles',
            module: 'Role'
        }
    ];

    for (const permission of permissions) {
        const isPermissionExists = await Permission.findOne({ name: permission.name });
        if (!isPermissionExists) await Permission.create(permission);
    }
}