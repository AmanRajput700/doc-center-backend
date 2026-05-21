const { body } = require('express-validator');
const createHttpError = require('http-errors');
const { STATUS_CODE } = require('../utils/constant')

const inviteMemberValidator = [
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Invalid email'),

    body('message')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage(
            'Message cannot exceed 500 characters'
        ),

    body('role')
        .notEmpty()
        .withMessage('Role is required')
        .isMongoId()
        .withMessage('Invalid role id')
];

const setPasswordValidator = [
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

module.exports = {
    setPasswordValidator,
    inviteMemberValidator
}