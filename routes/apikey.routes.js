const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const apiResponse = require('../utils/apiResponse');
const verifyToken = require('../middleware/verifyToken');
const router = express.Router();
const validate = require('../middleware/validate');
const { apiKeyGeneratorValidator, apiKeyIdValidator } = require('../validators/apiKeyValidator');
const success = require('../utils/response');

router.post('/', verifyToken, validate(apiKeyGeneratorValidator), asyncHandler(async function _generateApiKey(req, res, next) {
    const apiData = req.body;
    const { rawApiKey, rawSsoSecret } = await require('../controllers/apiKey/createApiKey')(apiData, req.tenant, req.user._id);
    return success(res, { rawApiKey, rawSsoSecret }, 'API Key generated succesfully', 201)
}));

router.get('/', verifyToken, asyncHandler(async function _viewApiKey(req, res, next) {
    const apiKeys = await require('../controllers/apiKey/getApiKey')(req.tenant._id);
    return success(res, { apiKeys }, 'API Key fetched succesfully');
}));

router.delete('/:id', verifyToken, validate(apiKeyIdValidator), asyncHandler(async function _deleteApiKey(req, res, next) {
    const apiKeyId = req.params.id;
    const deletedApiKey = await require('../controllers/apiKey/deleteApiKey')(apiKeyId, req.tenant, req.user._id);
    return success(res, { deletedApiKey }, 'API key is deleted Succesfully');
}));


module.exports = router;