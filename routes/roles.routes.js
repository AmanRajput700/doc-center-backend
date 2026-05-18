const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const apiResponse = require('../utils/apiResponse');
const verifyToken = require('../middleware/verifyToken');
const checkRole = require('../middleware/checkRoleMiddleware');
const router = express.Router();

router.get('/', verifyToken, checkRole('Admin'), asyncHandler(async function _getRole(req, res, next) {
    const tenant = req.tenant;
    const roles = await require('../controllers/role/getAllRolesByTenant')(tenant);
    return res.status(200).json(new apiResponse({ roles }, 200, 'Roles fetched succesfully'));
}))

module.exports = router;