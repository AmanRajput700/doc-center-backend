const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const verifyToken = require('../middleware/verifyToken');
const apiResponse = require('../utils/apiResponse');
const router = express.Router();

router.get('/', verifyToken, asyncHandler(async function _getUser(req, res, next) {
  const tenant = req.tenant;
  const users = await require('../controllers/user/getUserByTenant')(tenant.dbName);
  return res.status(200).json(new apiResponse({ users }, 200, 'User Fetched succesfully'));
}));

router.get('/me', verifyToken, asyncHandler(async function _me(req, res, next) {
  const userId = req.user._id;
  const userData = await require('../controllers/user/me')(userId, req.tenant.dbName);
  return res.status(200).json(new apiResponse({ userData }, 200, 'User Data fetched succesfully'))
}));

module.exports = router;
