const express = require('express');
const router = express.Router();
const success = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');
const verifyToken = require('../middleware/verifyToken');

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

router.post('/upload-session', verifyToken, asyncHandler(async function (req, res) {

    const result = await require('../controllers/sdk/uploadSession')(req.tenant, req.body, req.user._id);

    return success(res, result, 'Upload session created');
}));

router.get('/documents', verifyToken, asyncHandler(async function (req, res) {

    const documents = await require('../controllers/sdk/getDocuments')(req.tenant, req.query);
    return success(res, documents, 'Documents fetched successfully');
}));

module.exports = router;