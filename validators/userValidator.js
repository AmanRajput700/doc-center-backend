const { body, param } = require('express-validator');
const createHttpError = require('http-errors');
const { STATUS_CODE, ERROR_MESSAGE } = require('../utils/constant');

const updateUserValidator = [

    body('firstName')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('First name is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('First name must be between 2 and 50 characters')
        .matches(/^[A-Za-z\s]+$/)
        .withMessage('First name must contain only alphabets'),

    body('lastName')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Last name is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('Last name must be between 2 and 50 characters')
        .matches(/^[A-Za-z\s]+$/)
        .withMessage('Last name must contain only alphabets')
];

const changePasswordValidator = [

    body('currentPassword')
        .notEmpty()
        .withMessage('Current password is required')
        .isLength({ min: 8 })
        .withMessage('Current password must be at least 8 characters long'),

    body('newPassword')
        .notEmpty()
        .withMessage('New password is required')
        .isLength({ min: 8 })
        .withMessage('New password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
        .withMessage('Password must contain uppercase, lowercase, number and special character'),

    body('confirmPassword')
        .notEmpty()
        .withMessage('Confirm password is required')
        .custom((value, { req }) => {
            if (value !== req.body.newPassword) {
                throw new createHttpError(STATUS_CODE.CONFLICT, ERROR_MESSAGE.PASSWORD_MISMATCH);
            }
            return true;
        }
        )
];

const validateIds = [
    param('userId')
        .isMongoId()
        .withMessage('Invalid userId'),

    param('roleId')
        .isMongoId()
        .withMessage('Invalid roleId')
];

const paramIdValidator = [
    param('id')
        .isMongoId()
        .withMessage('Invalid userId'),
]

module.exports = { updateUserValidator, changePasswordValidator, validateIds,paramIdValidator }