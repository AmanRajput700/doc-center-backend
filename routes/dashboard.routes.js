const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const authorize = require('../middleware/authorize');
const asyncHandler = require('../utils/asyncHandler');
const apiResponse = require('../utils/apiResponse');
const success = require('../utils/response');
const router = express.Router();

router.get('/stats', verifyToken, asyncHandler(async function _getRecentUploadedDocs(req, res, next) {
    const tenant = req.tenant;
    const { storageDetails, planDetails, docsAddedThisWeek } = await require('../controllers/dashboard/getDashBoardDetails')(tenant);
    const stats = { storageDetails, planDetails, docsAddedThisWeek };
    return success(res, { stats }, 'Dashboard data fetched succesfully')
}));

router.get('/docs', verifyToken, authorize('view_document'), asyncHandler(async function _recentDocs(req, res, next) {
    const limit = req.query.limit;
    const tenant = req.tenant;
    const docs = await require('../controllers/dashboard/recentDocs')(limit, tenant);
    return success(res, { docs }, 'Recent Docs data fetched succesfully')

}));

module.exports = router;