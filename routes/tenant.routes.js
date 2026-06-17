const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const jwt = require('jsonwebtoken');
const apiResponse = require('../utils/apiResponse');
const validate = require('../middleware/validate');
const success = require('../utils/response');
const {
    registerTenantValidator,
    resendEmailValidator,
    generatePreSignedUrlForLogoValidator
} = require('../validators/tenantValidator');

router.post('/register', validate(registerTenantValidator), asyncHandler(async function _register(req, res, next) {
    const tenantData = req.body;
    const tenant = await require('../controllers/tenant/registerTenantController')(tenantData);

    return success(res, tenant, 'Tenant created');
}));

router.post('/resend-email', validate(resendEmailValidator), asyncHandler(async function _resendEmail(req, res, next) {
    const token = req.body.token;
    await require('../controllers/tenant/resendPasswordSetEmail')(token);

    return success(res, {}, 'Email sent succesfully');
}));

router.post('/logo-upload-url', validate(generatePreSignedUrlForLogoValidator), asyncHandler(async function _generatePreSignedUrlForLogo(req, res, next) {
    const logoData = req.body;
    const { key, url } = await require('../controllers/tenant/logoUploadPresignedUrl')(logoData);

    return success(res, { key, url }, 'Presigned Url generated succesfully');
}));

router.get('/logo-url', asyncHandler(async function _getLogoUrl(req, res, next) {
    const slug = req.query.slug;
    const url = await require('../controllers/tenant/logoViewPresignedUrl')(slug);

    return success(res, { url }, 'Presigned Url generated succesfully');
}));

module.exports = router;