const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const jwt = require('jsonwebtoken');
const apiResponse = require('../utils/apiResponse');
const validate = require('../middleware/validate');
const { registerTenantValidator, resendEmailValidator } = require('../validators/tenantValidator');

router.post('/register', validate(registerTenantValidator), asyncHandler(async function _register(req, res, next) {
    const tenantData = req.body;
    const tenant = await require('../controllers/tenant/registerTenantController')(tenantData);

    return res.status(201).json(new apiResponse(tenant, 201, 'Tenant created'));
}));

router.post('/resend-email', validate(resendEmailValidator), asyncHandler(async function _resendEmail(req, res, next) {
    const token = req.body.token;
    await require('../controllers/tenant/resendPasswordSetEmail')(token);

    return res.status(200).json(new apiResponse({}, 200, 'Email sent succesfully'));
}))

module.exports = router;