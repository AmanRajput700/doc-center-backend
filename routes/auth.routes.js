const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const apiResponse = require('../utils/apiResponse');
const router = express.Router();
const { completeOnboardingValidator } = require('../validators/authValidator.js');
const validate = require('../middleware/validate');

router.post('/complete-onboarding', validate(completeOnboardingValidator), asyncHandler(async function _completeOnboarding(req, res, next) {
    const userData = req.body;
    const user = await require('../controllers/auth/completeOnboardingController')(userData);
    return res.status(201).json(new apiResponse(user, 201, 'user succesfully on boarded'));
}))

module.exports = router;