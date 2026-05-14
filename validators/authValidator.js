const { body } = require('express-validator');
const createHttpError = require('http-errors');
const { STATUS_CODE } = require('../utils/constant')
const completeOnboardingValidator = [

    body('password')
        .trim()
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/[A-Z]/)
        .withMessage('Password must contain at least one uppercase letter')
        .matches(/[a-z]/)
        .withMessage('Password must contain at least one lowercase letter')
        .matches(/[0-9]/)
        .withMessage('Password must contain at least one number')
        .matches(/[!@#$%^&*(),.?":{}|<>]/)
        .withMessage(
            'Password must contain at least one special character'
        ),

    body('confirmPassword')
        .trim()
        .notEmpty()
        .withMessage('Confirm password is required')
        .custom((value, { req }) => {
            if (value !== req.body.password) throw new createHttpError(STATUS_CODE.CONFLICT, 'Passwords do not match');
            return true;
        }),

    body('token')
        .trim()
        .notEmpty()
        .withMessage('Token is required')
        .isUUID()
        .withMessage('Invalid token format')

];

const loginValidator = [
    // body("email")
    //     .notEmpty()
    //     .withMessage("Email is required")
    //     .isEmail()
    //     .withMessage("Enter a valid email"),

    body("password")
        .notEmpty()
        .withMessage("Password is required")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters"),

    body("emailVerifyToken")
        .notEmpty()
        .withMessage("Email verify token is required")
        .isJWT()
        .withMessage("Invalid email verify token"),

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
]

const emailValidator = [
    body("email")
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Enter a valid email"),
]

const resetPasswordValidator = [
    body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters'),

    body('confirmPassword')
        .notEmpty()
        .withMessage('Confirm password is required')
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new createHttpError(STATUS_CODE.CONFLICT, 'Passwords do not match');
            }
            return true;
        })
];

const otpValidator = [
    body('otp')
        .notEmpty()
        .withMessage('OTP is required')
        .isLength({ min: 6, max: 6 })
        .withMessage('OTP must be 6 digits')
        .isNumeric()
        .withMessage('OTP must contain only numbers')
];

module.exports = { completeOnboardingValidator, loginValidator, emailValidator, resetPasswordValidator, otpValidator };