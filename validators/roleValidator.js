const { body, param } = require('express-validator');

const paramIdValidator = [
    param('id')
        .isMongoId()
        .withMessage('Invalid document id')
]

const createRoleValidator = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ min: 3, max: 100 })
        .withMessage('Name must be between 3 and 100 characters'),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Description cannot exceed 500 characters')
]

const updatePermissionValidator = [
    body('permissionIds')
        .isArray()
        .withMessage('Permissions must be an array')
]

const updateRoleNameValidator = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ min: 3, max: 100 })
        .withMessage('Name must be between 3 and 100 characters'),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Description cannot exceed 500 characters')
]


module.exports = {
    paramIdValidator,
    createRoleValidator,
    updatePermissionValidator,
    updateRoleNameValidator
}