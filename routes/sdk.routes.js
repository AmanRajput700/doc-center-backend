const express = require('express');
const router = express.Router();
const success = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');
const verifyToken = require('../middleware/verifyToken');
const authorize = require('../middleware/authorize');
const apiAnalytics = require('../middleware/apiAnalytics');

router.post('/sso/exchange', asyncHandler(async function (req, res, next) {
    const { refreshToken, accessToken } = await require('../controllers/sdk/exchangeSSO')({
        apiKey: req.headers['x-api-key'],
        token: req.body.token
    });

    return success(res, { refreshToken, accessToken }, 'SSO Exchange Successful');
}));

router.get('/me', verifyToken, asyncHandler(async function (req, res) {
    const user = await require('../controllers/sdk/me')(req.user);

    return success(
        res,
        user,
        'User fetched successfully'
    );
})
);

router.post('/upload-session', verifyToken, authorize('upload_document'), apiAnalytics, asyncHandler(async function (req, res) {

    const result = await require('../controllers/sdk/uploadSession')(req.tenant, req.body, req.user._id);

    return success(res, result, 'Upload session created');
}));

router.post('/folders', verifyToken, authorize('upload_document'), apiAnalytics, asyncHandler(async function (req, res) {
    const tenant = req.tenant;
    const userId = req.user._id;
    const folderData = req.body;

    const folder = await require('../controllers/document/createFolder')(userId, folderData, tenant);
    return success(res, folder, 'New folder created successfully');
}));

router.get('/items', verifyToken, authorize('view_document'), apiAnalytics, asyncHandler(async function (req, res) {
    const items = await require('../controllers/sdk/listItems')(req.tenant, req.query);
    return success(res, items, 'Items fetched successfully');
}));

router.get('/documents/:id/view-url', verifyToken, authorize('view_document'), apiAnalytics, asyncHandler(async function (req, res) {
    const result = await require('../controllers/document/getPreSignedViewUrl')(req.params.id, req.tenant);
    return success(res, result, 'View URL generated successfully');
}));

router.delete('/documents/:id', verifyToken, authorize('delete_document'), apiAnalytics, asyncHandler(async function (req, res) {
    await require('../controllers/document/deleteDocument')(req.params.id, req.tenant);
    return success(res, null, 'Document deleted successfully');
}));

router.delete('/folders/:id', verifyToken, authorize('delete_document'), apiAnalytics, asyncHandler(async function (req, res) {
    await require('../controllers/document/deleteFolder')(req.params.id, req.tenant);
    return success(res, null, 'Folder deleted successfully');
}));

router.post('/refresh-token', asyncHandler(async function (req, res) {
    const { refreshToken, accessToken } = await require('../controllers/auth/refreshAccessToken')(req.body.refreshToken);
    return success(res, { refreshToken, accessToken }, 'Access token exchanged Successfully');
}));

module.exports = router;