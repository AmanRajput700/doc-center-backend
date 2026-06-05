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
        .withMessage('File extension is not allowed')
        .isString()
        .withMessage('Content type must be a string'),

    body('folderId')
        .customSanitizer(value => {
            return value === '' ? null : value;
        })
        .optional({ nullable: true })
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
const folderCreateValidator = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Folder name is required')
        .isString()
        .withMessage('Folder name must be a string')
        .isLength({ min: 1, max: 100 })
        .withMessage('Folder name must be between 1 and 100 characters'),

    body('parentFolderId')
        .customSanitizer(value => {
            return value === '' ? null : value;
        })
        .optional({ nullable: true })
        .isMongoId()
        .withMessage('Invalid parent folder id')
];

const nameUpdateValidator = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Folder name is required')
        .isString()
        .withMessage('Folder name must be a string')
        .isLength({ min: 1, max: 100 })
        .withMessage('Folder name must be between 1 and 100 characters'),

    param('id')
        .isMongoId()
        .withMessage('Invalid document id')

];


const generateDocumentShareUrlValidator = [

    body('expiryTime')
        .exists()
        .withMessage('Time is required')
        .bail()
        .isInt({
            min: 1,
            max: 60
        })
        .withMessage(
            'Share link expiration must be between 1 and 60 minutes'
        )
];

module.exports = {
    documentUploadValidator,
    paramIdValidator,
    folderCreateValidator,
    nameUpdateValidator,
    generateDocumentShareUrlValidator
}