const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const apiResponse = require('../utils/apiResponse');
const verifyToken = require('../middleware/verifyToken');
const authorize = require('../middleware/authorize');
const router = express.Router();
const validate = require('../middleware/validate');
const success = require('../utils/response');
const {
    paramIdValidator,
    createRoleValidator,
    updatePermissionValidator,
    updateRoleNameValidator
} = require('../validators/roleValidator');

router.get('/', verifyToken, authorize('view_role'), asyncHandler(async function _getRole(req, res, next) {
    const tenant = req.tenant;
    const { adminFlag } = req.query;
    const roles = await require('../controllers/role/getAllRolesByTenant')(tenant, adminFlag);
    return success(res, { roles }, 'Roles fetched succesfully');
}));

router.post('/', verifyToken, authorize('create_role'), validate(createRoleValidator), asyncHandler(async function _createRole(req, res, next) {
    const roleData = req.body;
    const newRole = await require('../controllers/role/createRole')(roleData, req.tenant.dbName);
    return success(res, { newRole }, 'Role created successfully');
}));

router.delete('/:id', verifyToken, authorize('delete_role'), validate(paramIdValidator), asyncHandler(async function _deleteRole(req, res, next) {
    const roleId = req.params.id;
    const deletedRole = await require('../controllers/role/deleteRole')(roleId, req.tenant.dbName);
    return success(res, { deletedRole }, 'Role Deleted successfully');
}));

router.put('/permissions/:id', verifyToken, authorize('assign_permission'), validate(updatePermissionValidator), asyncHandler(async function _updatePermission(req, res, next) {
    const roleId = req.params.id;
    const permissionData = req.body;
    const userId = req.user._id;
    const updatedRole = await require('../controllers/role/updateRolePermission')(roleId, userId, permissionData, req.tenant);
    return success(res, { updatedRole }, 'Permission updated succesfully');
}));

router.put('/:id', verifyToken, authorize('update_role'), validate(updateRoleNameValidator), asyncHandler(async function _updateRoleName(req, res, next) {
    const roleId = req.params.id;
    const roleData = req.body;
    const updatedRole = await require('../controllers/role/updateRole')(roleId, roleData, req.tenant.dbName);
    return success(res, { updatedRole }, 'Role updated');
}));

module.exports = router;