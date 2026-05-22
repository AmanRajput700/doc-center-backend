const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const checkRole = require('../middleware/checkRoleMiddleware');
const upload = require('../config/multer.config');
const asyncHandler = require('../utils/asyncHandler');
const apiResponse = require('../utils/apiResponse');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { documentUploadValidator, paramIdValidator } = require('../validators/documentValidator');

router.post('/presigned-upload-url', verifyToken, authorize('upload_document'), validate(documentUploadValidator), asyncHandler(async function _getPresignedUploadUrl(req, res, next) {
    const tenant = req.tenant;
    const fileData = req.body;
    const userId = req.user._id;

    const { documentId, url, key } = await require('../controllers/document/getPresignedUploadUrl')(tenant, fileData, userId);
    return res.status(200).json(new apiResponse({ documentId, url, key }, 200, 'Pre-Signed upload url is genrated succesfully'));
}));

router.post('/:id/complete', verifyToken, authorize('upload_document'), validate(paramIdValidator), asyncHandler(async function _uploadComplete(req, res, next) {
    const tenant = req.tenant;
    const documentId = req.params.id;
    const document = await require('../controllers/document/uploadCompleted')(documentId, tenant);
    return res.status(200).json(new apiResponse({ document }, 200, 'Document Upload Completed'));
}));

router.post('/:id/failed', verifyToken, authorize('upload_document'), validate(paramIdValidator), asyncHandler(async function _uploadFail(req, res, next) {
    const tenant = req.tenant;
    const documentId = req.params.id;
    const document = await require('../controllers/document/uploadFailed')(documentId, tenant);
    return res.status(200).json(new apiResponse({ document }, 200, 'Document Upload Failed'));
}));



router.post('/upload', verifyToken, authorize('upload_document'), upload.single('document'), asyncHandler(async function _upload(req, res, next) {
    const docData = req.body;
    const uploadedBy = req.user._id;
    const file = req.file;
    const dbName = req.tenant.dbName;

    const docs = await require('../controllers/document/uploadDocument')(docData, file, uploadedBy, dbName);
    return res.status(200).json(new apiResponse({ docs }, 200, 'Document uploaded succesfully'))
}));

router.get('/', verifyToken, authorize('view_document'), asyncHandler(async function _getDocs(req, res, next) {
    const dbName = req.tenant.dbName;
    const parentId = req.query.parentId;
    const docs = await require('../controllers/document/getDocumentByTenant')(dbName, parentId);
    return res.status(200).json(new apiResponse({ docs }, 200, 'Documents fetched succesfully'));
}));

router.delete('/:id', verifyToken, authorize('delete_document'), asyncHandler(async function _deleteDocument(req, res, next) {
    const docId = req.params.id;
    const deletedDoc = await require('../controllers/document/deleteDocument')(docId, req.tenant.dbName);
    return res.status(200).json(new apiResponse({ deletedDoc }, 200, 'Document Deleted Succesfully'));
}));

router.put('/:id', verifyToken, authorize('update_document'), asyncHandler(async function _updateDocument(req, res, next) {
    const docId = req.params.id;
    const data = req.body;
    const updatedDoc = await require('../controllers/document/updateDocument')(docId, data, req.tenant.dbName);
    return res.status(200).json(new apiResponse({ updatedDoc }, 200, 'Document Updated Succesfully'));
}))

module.exports = router;