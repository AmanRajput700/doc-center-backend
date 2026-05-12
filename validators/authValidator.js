const { body } = require('express-validator');
const createHttpError = require('http-errors');
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
            if (value !== req.body.password) throw new createHttpError(createHttpError.Conflict, 'Passwords do not match');
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
    body("email")
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Enter a valid email"),

    body("password")
        .notEmpty()
        .withMessage("Password is required")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters"),
]

const emailValidator = [
    body("email")
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Enter a valid email"),
]

module.exports = { completeOnboardingValidator, loginValidator, emailValidator };