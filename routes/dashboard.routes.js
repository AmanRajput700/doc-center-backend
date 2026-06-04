const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const authorize = require('../middleware/authorize');
const asyncHandler = require('../utils/asyncHandler');
const apiResponse = require('../utils/apiResponse');
const router = express.Router();

router.get('/', verifyToken, asyncHandler(async function _getRecentUploadedDocs(req, res, next) {
    const { docs, storageDetails, planDetails, docsAddedThisWeek } = await require('../controllers/dashboard/getDashBoardDetails')(req.tenant);
    const stats = { storageDetails, planDetails, docsAddedThisWeek };
    return res.status(200).json(new apiResponse({ docs, stats }, 200, 'Dashboard data fetched succesfully'));
}));

module.exports = router;