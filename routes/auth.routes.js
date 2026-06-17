const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const apiResponse = require('../utils/apiResponse');
const router = express.Router();
const { completeOnboardingValidator, verifyTokenValidator, loginValidator, emailValidator, resetPasswordValidator, otpValidator } = require('../validators/authValidator.js');
const validate = require('../middleware/validate');
const verifyToken = require('../middleware/verifyToken.js');
const rateLimiter = require('../middleware/rateLimiter.js');
const success = require('../utils/response.js');


router.post('/forgot-password',
    rateLimiter(5, 5, "Too many requests detected. Please wait before trying again."),
    validate(emailValidator),
    asyncHandler(async function _forgotPassword(req, res, next) {
        const userData = req.body;
        const expiryTime = await require('../controllers/auth/forgot-password.js')(userData);
        return success(res, { expiryTime }, 'OTP sent succesfully if account exists');
    })
);

router.post('/verify-forgot-password-otp',
    validate(otpValidator),
    asyncHandler(async function _verifyOtp(req, res, next) {
        const userData = req.body;
        const resetPasswordToken = await require('../controllers/auth/verify-forgot-password-otp.js')(userData);
        return success(res, { resetPasswordToken }, 'OTP Verified');
    })
);

router.post('/reset-password',
    validate(resetPasswordValidator),
    asyncHandler(async function _resetPassword(req, res, next) {
        const userData = req.body;
        const response = await require('../controllers/auth/reset-password.js')(userData);
        return success(res, {}, 'Password Set Succesfully');
    })
);

router.post('/resend-otp',
    validate(emailValidator),
    asyncHandler(async function _resendOtp(req, res, next) {
        const email = req.body.email;
        const expiryTime = await require('../controllers/auth/resendForgotPasswordOtp.js')(email);
        return success(res, { expiryTime }, 'OTP re-send succesfully');
    })
);

router.post('/complete-onboarding',
    validate(completeOnboardingValidator),
    asyncHandler(async function _completeOnboarding(req, res, next) {
        const userData = req.body;
        await require('../controllers/auth/completeOnboardingController')(userData);
        return success(res, {}, 'User succesfully on-boarded', 201);
    })
);

router.post('/login',
    validate(loginValidator),
    asyncHandler(async function _login(req, res, next) {
        const userData = req.body;
        const { refreshToken, accessToken } = await require('../controllers/auth/login.js')(userData);
        // const cookieOptions = {
        //     httpOnly: true,
        //     secure: false,
        //     sameSite: 'lax',
        //     path: '/',
        //     maxAge: 7 * 24 * 60 * 60 * 1000
        // };
        res.cookie('accessToken', accessToken);
        res.cookie('refreshToken', refreshToken);
        return success(res, { accessToken, refreshToken }, 'User Successfully LogedIn')
    })
);

router.post('/verify-email',
    rateLimiter(5, 5, "Too many verification attempts. Try again later."),
    validate(emailValidator),
    asyncHandler(async function _verifyEmail(req, res, next) {
        const email = req.body.email;
        const { slug } = await require('../controllers/auth/verifyEmail.js')(email);
        return success(res, { slug }, 'Email Verified Succesfully');
    })
);

router.post('/refresh-access-token',
    asyncHandler(async function _refreshAccessToken(req, res, next) {
        const token = req.body.refreshToken;
        const { refreshToken, accessToken } = await require('../controllers/auth/refreshAccessToken.js')(token);
        return success(res, { refreshToken, accessToken }, 'New access-token generated');
    })
);

router.get('/validate-secure-token',
    asyncHandler(async function _verifySetPasswordToken(req, res, next) {
        const token = req.query.token;
        const status = await require('../controllers/auth/validateTenantSetPasswordToken.js')(token);
        return success(res, { status }, `Token ${status}`);
    })
);

// router.post('/validate-login-token', validate(verifyTokenValidator), asyncHandler(async function _(req, res, next) {
//     const userData = req.body;
//     await require('../controllers/auth/verify-login-token.js')(userData);
//     return res.status(200).json(new apiResponse('', 200, 'Verified login token'));
// }));

router.post('/logout',
    verifyToken,
    asyncHandler(async function _logout(req, res, next) {
        const userId = req.user._id;
        const tenant = req.tenant;
        await require('../controllers/auth/logout.js')(userId, tenant.dbName);
        return success(res, {}, 'User logout successfully');
    })
);

module.exports = router;