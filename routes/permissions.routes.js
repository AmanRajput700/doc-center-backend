const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const apiResponse = require('../utils/apiResponse');
const verifyToken = require('../middleware/verifyToken');

router.get('/catalog', verifyToken, asyncHandler(async function _permissionCatalog(req, res, next) {
    const permissionCatalog = await require('../controllers/permission/permissionCatalog')(req.tenant.dbName);
    return res.status(200).json(new apiResponse({ permissionCatalog }, 200, 'Permission fetched successfully'));
}));

module.exports = router;