const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const apiResponse = require('../utils/apiResponse');
const router = express.Router();
const { completeOnboardingValidator, verifyTokenValidator, loginValidator, emailValidator, resetPasswordValidator, otpValidator } = require('../validators/authValidator.js');
const validate = require('../middleware/validate');
const verifyToken = require('../middleware/verifyToken.js');

router.post('/forgot-password', validate(emailValidator), asyncHandler(async function _forgotPassword(req, res, next) {
    const userData = req.body;
    const expiryTime = await require('../controllers/auth/forgot-password.js')(userData);
    return res.status(200).json(new apiResponse({ expiryTime }, 200, 'OTP sent succesfully if account exists'));
}));

router.post('/verify-forgot-password-otp', validate(otpValidator), asyncHandler(async function _verifyOtp(req, res, next) {
    const userData = req.body;
    const resetPasswordToken = await require('../controllers/auth/verify-forgot-password-otp.js')(userData);
    return res.status(200).json(new apiResponse({ resetPasswordToken }, 200, 'OTP verified'));
}));

router.post('/reset-password', validate(resetPasswordValidator), asyncHandler(async function _resetPassword(req, res, next) {
    const userData = req.body;
    const response = await require('../controllers/auth/reset-password.js')(userData);
    return res.status(200).json(new apiResponse('', 200, 'Password Set successfully'));
}));

router.post('/resend-otp', validate(emailValidator), asyncHandler(async function _resendOtp(req, res, next) {
    const email = req.body.email;
    const expiryTime = await require('../controllers/auth/resendForgotPasswordOtp.js')(email);
    return res.status(200).json(new apiResponse({ expiryTime }, 200, 'OTP re-send succesfully'));
}));

router.post('/complete-onboarding', validate(completeOnboardingValidator), asyncHandler(async function _completeOnboarding(req, res, next) {
    const userData = req.body;
    const user = await require('../controllers/auth/completeOnboardingController')(userData);
    return res.status(201).json(new apiResponse({ user }, 201, 'user succesfully on boarded'));
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
    res.cookie('accessToken', accessToken);
    res.cookie('refreshToken', refreshToken);
    return res.status(200).json(new apiResponse({ user, slug, accessToken, refreshToken }, 200, 'User Succefully logedIn'));
}));

router.post('/verify-email', validate(emailValidator), asyncHandler(async function _verifyEmail(req, res, next) {
    const email = req.body.email;
    const { slug } = await require('../controllers/auth/verifyEmail.js')(email);
    return res.status(200).json(new apiResponse({ slug }, 200, 'Email exists'));
}));

router.post('/refresh-access-token', asyncHandler(async function _refreshAccessToken(req, res, next) {
    const token = req.body.refreshToken;
    const { refreshToken, accessToken } = await require('../controllers/auth/refreshAccessToken.js')(token);
    return res.status(200).json(new apiResponse({ refreshToken, accessToken }, 200, 'New access-token generated'));
}));

router.get('/validate-secure-token', asyncHandler(async function _verifySetPasswordToken(req, res, next) {
    const token = req.query.token;
    const status = await require('../controllers/auth/validateTenantSetPasswordToken.js')(token);
    return res.status(200).json(new apiResponse({ status }, 200, 'Token validate'));
}));

// router.post('/validate-login-token', validate(verifyTokenValidator), asyncHandler(async function _(req, res, next) {
//     const userData = req.body;
//     await require('../controllers/auth/verify-login-token.js')(userData);
//     return res.status(200).json(new apiResponse('', 200, 'Verified login token'));
// }));

router.post('/logout', verifyToken, asyncHandler(async function _logout(req, res, next) {
    const userId = req.user._id;
    const tenant = req.tenant;
    await require('../controllers/auth/logout.js')(userId, tenant.dbName);
    return res.status(200).json(new apiResponse({}, 200, 'User logout succesfully'));
}));

module.exports = router;