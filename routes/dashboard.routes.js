const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const authorize = require('../middleware/authorize');
const asyncHandler = require('../utils/asyncHandler');
const apiResponse = require('../utils/apiResponse');
const router = express.Router();

router.get('/stats', verifyToken, asyncHandler(async function _getRecentUploadedDocs(req, res, next) {
    const tenant = req.tenant;
    const { storageDetails, planDetails, docsAddedThisWeek } = await require('../controllers/dashboard/getDashBoardDetails')(tenant);
    const stats = { storageDetails, planDetails, docsAddedThisWeek };
    return res.status(200).json(new apiResponse({ stats }, 200, 'Dashboard data fetched succesfully'));
}));

router.get('/docs', verifyToken, authorize('view_document'), asyncHandler(async function _recentDocs(req, res, next) {
    const limit = req.query.limit;
    const tenant = req.tenant;
    const docs = await require('../controllers/dashboard/recentDocs')(limit, tenant);
    return res.status(200).json(new apiResponse({ docs }, 200, 'Recent Docs data fetched succesfully'));

}));

module.exports = router;