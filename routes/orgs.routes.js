const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const apiResponse = require('../utils/apiResponse');
const verifyToken = require('../middleware/verifyToken');

router.get('/', verifyToken, asyncHandler(async function _getOrgDetails(req, res, next) {
    const userId = req.user._id;
    const userOrg = await require('../controllers/org/getOrgDetails')(userId, req.tenant.dbName);
    return res.status(200).json(new apiResponse(userOrg, 200, 'Details fetched successfully'));
}));

router.put('/', verifyToken, asyncHandler(async function _updateOrgDetails(req, res, next) {
    const orgData = req.body;
    const tenant = req.tenant;
    const user = req.user;
    await require('../controllers/org/updateOrgDetails')(orgData, user, tenant);
    return res.status(200).json(new apiResponse({}, 200, 'Organization data updated successfully'));
}));

module.exports = router;