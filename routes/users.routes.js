const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const verifyToken = require('../middleware/verifyToken');
const apiResponse = require('../utils/apiResponse');
const router = express.Router();
const validate = require('../middleware/validate');
const success = require('../utils/response');
const { updateUserValidator, changePasswordValidator, validateIds, paramIdValidator } = require('../validators/userValidator');
const authorize = require('../middleware/authorize');
const { emitToUser, emitToTenant } = require('../socket/services/emitService');

router.get('/', verifyToken, authorize('view_user'), asyncHandler(async function _getUser(req, res, next) {
  const tenant = req.tenant;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const q = req.query.q;
  const type = req.query.type;

  const queryData = { page, limit, q, type };
  const { paginationData, users } = await require('../controllers/user/getUserByTenant')(queryData, tenant.dbName);

  return success(res, { users, paginationData }, 'User Fetched succesfully');
}));

router.get('/me', verifyToken, asyncHandler(async function _me(req, res, next) {
  const tenant = req.tenant;
  const userId = req.user._id;

  emitToTenant(
    tenant._id,
    'hello',
    {
      message: 'Socket Working'
    }
  );

  const { user, userNotificationPreferences } = await require('../controllers/user/me')(userId, tenant);

  return success(res, { user, userNotificationPreferences }, 'User Data fetched succesfully');
}));

router.put('/', verifyToken, validate(updateUserValidator), asyncHandler(async function _updateProfile(req, res, next) {
  const userId = req.user._id;
  const userData = req.body;

  const updatedUser = await require('../controllers/user/updateProfile')(userData, userId, req.tenant.dbName);

  return success(res, { updatedUser }, 'User Data updated succesfully');
}));

router.put('/:userId/roles/:roleId', verifyToken, authorize('assign_role'), validate(validateIds), asyncHandler(async function _updateUserRole(req, res, next) {
  const userId = req.params.userId;
  const roleId = req.params.roleId;
  const adminUser = req.user;
  const tenant = req.tenant;

  const updateduser = await require('../controllers/user/assignRoleToUser')(userId, roleId, tenant, adminUser);

  return success(res, { updateduser }, 'Role updated succesfully');
}));

router.post('/change-password', verifyToken, validate(changePasswordValidator), asyncHandler(async function _changePassword(req, res, next) {
  const data = req.body;
  const userId = req.user._id;

  await require('../controllers/user/changePassword')(data, userId, req.tenant);

  return success(res, {}, 'User Password changed succesfully');
}));

router.delete('/:id', verifyToken, authorize('delete_user'), validate(paramIdValidator), asyncHandler(async function _deleteUser(req, res, next) {
  const userId = req.params.id;
  const adminUser = req.user;
  const tenant = req.tenant;

  const deletedUser = await require('../controllers/user/deleteUser')(userId, tenant, adminUser);

  return success(res, { deletedUser }, 'User delted Succesfully');
}));

module.exports = router;