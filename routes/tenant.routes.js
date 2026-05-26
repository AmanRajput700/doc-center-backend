const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const jwt = require('jsonwebtoken');
const apiResponse = require('../utils/apiResponse');
const validate = require('../middleware/validate');
const { registerTenantValidator, resendEmailValidator, generatePreSignedUrlForLogoValidator } = require('../validators/tenantValidator');

router.post('/register', validate(registerTenantValidator), asyncHandler(async function _register(req, res, next) {
    const tenantData = req.body;
    const tenant = await require('../controllers/tenant/registerTenantController')(tenantData);

    return res.status(201).json(new apiResponse(tenant, 201, 'Tenant created'));
}));

router.post('/resend-email', validate(resendEmailValidator), asyncHandler(async function _resendEmail(req, res, next) {
    const token = req.body.token;
    await require('../controllers/tenant/resendPasswordSetEmail')(token);

    return res.status(200).json(new apiResponse({}, 200, 'Email sent succesfully'));
}));

router.post('/logo-upload-url', validate(generatePreSignedUrlForLogoValidator), asyncHandler(async function _generatePreSignedUrlForLogo(req, res, next) {
    const logoData = req.body;
    const { key, url } = await require('../controllers/tenant/logoUploadPresignedUrl')(logoData);
    return res.status(200).json(new apiResponse({ key, url }, 200, 'Presigned Url generated succesfully'));
}));

router.get('/logo-url', asyncHandler(async function _getLogoUrl(req, res, next) {
    const slug = req.query.slug;
    const url = await require('../controllers/tenant/logoViewPresignedUrl')(slug);
    return res.status(200).json(new apiResponse({ url }, 200, 'Presigned Url generated succesfully'));
}))

module.exports = router;