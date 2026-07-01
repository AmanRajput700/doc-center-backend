const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const apiResponse = require('../utils/apiResponse');
const verifyToken = require('../middleware/verifyToken');
const success = require('../utils/response');

router.get('/catalog', verifyToken, asyncHandler(async function _permissionCatalog(req, res, next) {
    const permissionCatalog = await require('../controllers/permission/permissionCatalog')(req.tenant.dbName);
    return success(res, { permissionCatalog }, 'Permission fetched successfully');
}));

module.exports = router;