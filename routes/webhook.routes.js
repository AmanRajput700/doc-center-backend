const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const router = express.Router();
const apiResponse = require('../utils/apiResponse');

router.post('/s3-uploaded', asyncHandler(async function (req, res, next) {
    const apiKey = req.headers['x-api-key'];
    const data = req.body;
    await require('../controllers/webhooks/s3Uploaded')(apiKey, data);

    return res.status(200).json(new apiResponse({}, 200, 'Docs Data updated successfully'));
}));

module.exports = router;