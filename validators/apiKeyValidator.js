const { body, param } = require('express-validator');

const apiKeyGeneratorValidator = [
    body("name")
        .trim()
        .notEmpty()
        .withMessage('Tenant slug is required')
];

const apiKeyIdValidator = [
    param('id')
        .notEmpty()
        .withMessage('ID is required')
        .isMongoId()
        .withMessage('Invalid mongoID'),
];

module.exports = {
    apiKeyGeneratorValidator,
    apiKeyIdValidator
}