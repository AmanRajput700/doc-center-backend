const { body } = require('express-validator');

const registerTenantValidator = [
    body('orgName')
        .trim()
        .notEmpty()
        .withMessage('Organization name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Organization name must be between 2 and 100 characters'),

    body('orgSlogan')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Organization slogan cannot exceed 200 characters'),

    body('slug')
        .trim()
        .notEmpty()
        .withMessage('Tenant slug is required')
        .isLength({ min: 3, max: 50 })
        .withMessage('Slug must be between 3 and 50 characters')
        .matches(/^[a-z0-9-]+$/)
        .withMessage(
            'Slug can only contain lowercase letters, numbers, and hyphens'
        ),

    // body('logo')
    //     .optional()
    //     .trim()
    //     .isURL()
    //     .withMessage('Logo must be a valid URL'),

    body('firstName')
        .trim()
        .notEmpty()
        .withMessage('First name is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('First name must be between 2 and 50 characters'),

    body('lastName')
        .trim()
        .notEmpty()
        .withMessage('Last name is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('Last name must be between 2 and 50 characters'),

    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Please provide a valid email')
        .normalizeEmail()
];

module.exports = {
    registerTenantValidator
}