const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const apiResponse = require('../utils/apiResponse');
const router = express.Router();
const { completeOnboardingValidator, loginValidator } = require('../validators/authValidator.js');
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
    const cookieOptions = {
        httpOnly: true,
        secure: false,
        path: "/",
    }
    res.cookie('accessToken', accessToken, cookieOptions);
    res.cookie('refreshToken', refreshToken, cookieOptions);
    return res.status(200).json(new apiResponse({ user, slug }, 200, 'User Succefully logedIn'));
}));

router.get('/me', verifyToken, asyncHandler(async function _verify(req, res, next) {
    res.send('Log in');
}))

module.exports = router;