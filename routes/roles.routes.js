const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const apiResponse = require('../utils/apiResponse');
const verifyToken = require('../middleware/verifyToken');
const authorize = require('../middleware/authorize');
const router = express.Router();

router.get('/', verifyToken, authorize('view_role'), asyncHandler(async function _getRole(req, res, next) {
    const tenant = req.tenant;
    const roles = await require('../controllers/role/getAllRolesByTenant')(tenant);
    return res.status(200).json(new apiResponse({ roles }, 200, 'Roles fetched succesfully'));
}));

router.post('/', verifyToken, authorize('create_role'), asyncHandler(async function _createRole(req, res, next) {
    const roleData = req.body;
    const newRole = await require('../controllers/role/createRole')(roleData, req.tenant.dbName);
    return res.status(201).json(new apiResponse({ newRole }, 201, 'Role created successfully'));
}));

router.delete('/:id', verifyToken, authorize('delete_role'), asyncHandler(async function _deleteRole(req, res, next) {
    const roleId = req.params.id;
    const deletedRole = await require('../controllers/role/deleteRole')(roleId, req.tenant.dbName);
    return res.status(200).json(new apiResponse({ deletedRole }, 200, 'Role Deleted successfully'));
}));

router.put('/permissions/:id', verifyToken, authorize('assign_permission'), asyncHandler(async function _updatePermission(req, res, next) {
    const roleId = req.params.id;
    const permissionData = req.body;
    const updatedRole = await require('../controllers/role/updateRolePermission')(roleId, permissionData, req.tenant.dbName);
    return res.status(200).json(new apiResponse({ updatedRole }, 200, 'Permission updated succesfully'));
}));

router.put('/:id', verifyToken, authorize('update_role'), asyncHandler(async function _updateRoleName(req, res, next) {
    const roleId = req.params.id;
    const roleData = req.body;
    const updatedRole = await require('../controllers/role/updateRole')(roleId, roleData, req.tenant.dbName);
    return res.status(200).json(new apiResponse({ updatedRole }, 200, 'Role updated'));
}));

module.exports = router;