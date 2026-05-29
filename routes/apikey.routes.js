const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const apiResponse = require('../utils/apiResponse');
const verifyToken = require('../middleware/verifyToken');
const router = express.Router();

router.post('/', verifyToken, asyncHandler(async function _generateApiKey(req, res, next) {
    const apiData = req.body;
    const apiKey = await require('../controllers/apiKey/createApiKey')(apiData, req.tenant._id, req.user._id);
    return res.status(200).json(new apiResponse({ apiKey }, 200, 'API Key generated succesfully'));
}));

module.exports = router;