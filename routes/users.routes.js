const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const verifyToken = require('../middleware/verifyToken');
const apiResponse = require('../utils/apiResponse');
const router = express.Router();
const validate = require('../middleware/validate');
const { updateUserValidator, changePasswordValidator } = require('../validators/userValidator')

router.get('/', verifyToken, asyncHandler(async function _getUser(req, res, next) {
  const tenant = req.tenant;
  const users = await require('../controllers/user/getUserByTenant')(tenant.dbName);
  return res.status(200).json(new apiResponse({ users }, 200, 'User Fetched succesfully'));
}));

router.get('/me', verifyToken, asyncHandler(async function _me(req, res, next) {
  const userId = req.user._id;
  const userData = await require('../controllers/user/me')(userId, req.tenant.dbName);
  return res.status(200).json(new apiResponse({ userData }, 200, 'User Data fetched succesfully'));
}));

router.put('/', verifyToken, validate(updateUserValidator), asyncHandler(async function _updateProfile(req, res, next) {
  const userId = req.user._id;
  const userData = req.body;
  const updatedUser = await require('../controllers/user/updateProfile')(userData, userId, req.tenant.dbName);
  return res.status(200).json(new apiResponse({ updatedUser }, 200, 'User Data updated succesfully'));
}));

router.post('/change-password', verifyToken, validate(changePasswordValidator), asyncHandler(async function _changePassword(req, res, next) {
  const data = req.body;
  const userId = req.user._id;
  await require('../controllers/user/changePassword')(data, userId, req.tenant.dbName);
  return res.status(200).json(new apiResponse({}, 200, 'User Password changed succesfully'));
}))

module.exports = router;
