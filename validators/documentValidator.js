const { body, param } = require('express-validator');

const documentUploadValidator = [

    body('fileName')
        .trim()
        .notEmpty()
        .withMessage('File name is required')
        .isString()
        .withMessage('File name must be a string'),

    body('contentType')
        .trim()
        .notEmpty()
        .withMessage('Content type is required')
        .isString()
        .withMessage('Content type must be a string'),

    body('folderId')
        .optional({ nullable: true, checkFalsy: true })
        .isMongoId()
        .withMessage('Invalid folder id'),

    body('size')
        .notEmpty()
        .withMessage('File size is required')
        .isNumeric()
        .withMessage('Size must be numeric')
        .custom(value => value >= 0)
        .withMessage('Size cannot be negative')
];

const paramIdValidator = [
    param('id')
        .isMongoId()
        .withMessage('Invalid document id')
]

module.exports = {
    documentUploadValidator,
    paramIdValidator
}