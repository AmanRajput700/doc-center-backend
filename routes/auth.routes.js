const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const apiResponse = require('../utils/apiResponse');
const router = express.Router();
const { completeOnboardingValidator, loginValidator, emailValidator } = require('../validators/authValidator.js');
const validate = require('../middleware/validate');
const verifyToken = require('../middleware/verifyToken.js');


router.post('/complete-onboarding', validate(completeOnboardingValidator), asyncHandler(async function _completeOnboarding(req, res, next) {
    const userData = req.body;
    const user = await require('../controllers/auth/completeOnboardingController')(userData);
    return res.status(201).json(new apiResponse(user, 201, 'user succesfully on boarded'));
}));

router.post('/login', validate(loginValidator), asyncHandler(async function _login(req, res, next) {
    const userData = req.body;
    const { user, slug, refreshToken, accessToken } = await require('../controllers/auth/login.js')(userData);
    // const cookieOptions = {
    //     httpOnly: true,
    //     secure: false,
    //     sameSite: 'lax',
    //     path: '/',
    //     maxAge: 7 * 24 * 60 * 60 * 1000
    // };
    // res.cookie('accessToken', accessToken, cookieOptions);
    // res.cookie('refreshToken', refreshToken, cookieOptions);
    return res.status(200).json(new apiResponse({ user, slug, accessToken }, 200, 'User Succefully logedIn'));
}));

router.post('/verify-email', validate(emailValidator), asyncHandler(async function _verifyEmail(req, res, next) {
    const email = req.body.email;
    const slug = await require('../controllers/auth/verifyEmail.js')(email);
    return res.status(200).json(new apiResponse({ slug }, 200, 'Email exists'));
}));

router.get('/validate-secure-token', asyncHandler(async function _verifySetPasswordToken(req, res, next) {
    const token = req.query.token;
    const status = await require('../controllers/auth/validateResetToken.js')(token);
    return res.status(200).json(new apiResponse({ status }, 200, 'Token validate'));
}));

router.get('/me', verifyToken, asyncHandler(async function _verifyTenant(req, res, next) {
    return res.status(200).json(new apiResponse('', 200, 'Valid User'));
}));

module.exports = router;