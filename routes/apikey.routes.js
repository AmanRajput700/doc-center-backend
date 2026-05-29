const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const apiResponse = require('../utils/apiResponse');
const verifyToken = require('../middleware/verifyToken');
const router = express.Router();
const validate = require('../middleware/validate');
const { apiKeyGeneratorValidator, apiKeyIdValidator } = require('../validators/apiKeyValidator');

router.post('/', verifyToken, validate(apiKeyGeneratorValidator), asyncHandler(async function _generateApiKey(req, res, next) {
    const apiData = req.body;
    const apiKey = await require('../controllers/apiKey/createApiKey')(apiData, req.tenant, req.user._id);
    return res.status(201).json(new apiResponse({ apiKey }, 201, 'API Key generated succesfully'));
}));

router.get('/', verifyToken, asyncHandler(async function _viewApiKey(req, res, next) {
    const apiKeys = await require('../controllers/apiKey/getApiKey')(req.tenant._id);
    return res.status(200).json(new apiResponse({ apiKeys }, 200, 'API Key fetched succesfully'));
}));

router.delete('/:id', verifyToken, validate(apiKeyIdValidator), asyncHandler(async function _deleteApiKey(req, res, next) {
    const apiKeyId = req.params.id;
    const deletedApiKey = await require('../controllers/apiKey/deleteApiKey')(apiKeyId, req.tenant, req.user._id);
    return res.status(200).json(new apiResponse({ deletedApiKey }, 200, 'API key is deleted Succesfully'));
}));


module.exports = router;