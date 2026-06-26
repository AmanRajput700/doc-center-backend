const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const checkRole = require('../middleware/checkRoleMiddleware');
const upload = require('../config/multer.config');
const asyncHandler = require('../utils/asyncHandler');
const apiResponse = require('../utils/apiResponse');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { documentUploadValidator, generateDocumentShareUrlValidator, nameUpdateValidator, paramIdValidator, folderCreateValidator } = require('../validators/documentValidator');
const success = require('../utils/response');

router.post('/presigned-upload-url', verifyToken, authorize('upload_document'), validate(documentUploadValidator), asyncHandler(async function _getPresignedUploadUrl(req, res, next) {
    const tenant = req.tenant;
    const fileData = req.body;
    const userId = req.user._id;

    const { documentId, url, key } = await require('../controllers/document/getPresignedUploadUrl')(tenant, fileData, userId);
    return success(res, { documentId, url, key }, 'Pre-Signed upload url is genrated succesfully')
}));

router.post('/:id/complete', verifyToken, authorize('upload_document'), validate(paramIdValidator), asyncHandler(async function _uploadComplete(req, res, next) {
    const tenant = req.tenant;
    const documentId = req.params.id;
    const user = req.user;
    const document = await require('../controllers/document/uploadCompleted')(documentId, tenant, user);
    return success(res, { document }, 'Document Upload Completed');
}));

router.post('/:id/failed', verifyToken, authorize('upload_document'), validate(paramIdValidator), asyncHandler(async function _uploadFail(req, res, next) {
    const tenant = req.tenant;
    const documentId = req.params.id;
    const document = await require('../controllers/document/uploadFailed')(documentId, tenant);
    return success(res, { document }, 'Document Upload Failed');
}));

router.post('/folder', verifyToken, authorize('upload_document'), validate(folderCreateValidator), asyncHandler(async function _createFolder(req, res, next) {
    const userId = req.user._id;
    const tenant = req.tenant;
    const folderData = req.body;

    const data = await require('../controllers/document/createFolder')(userId, folderData, tenant);
    return success(res, {}, 'Folder Created', 201);
}));


router.get('/:id/view-url', verifyToken, authorize('view_document'), validate(paramIdValidator), asyncHandler(async function _getPresignedViewUrl(req, res, next) {
    const tenant = req.tenant;
    const docId = req.params.id;
    const { url } = await require('../controllers/document/getPreSignedViewUrl')(docId, tenant);
    return success(res, { url }, 'Pre-Signed View url is generated succesfully');
}));

router.get('/', verifyToken, authorize('view_document'), asyncHandler(async function _getDocs(req, res, next) {
    const tenant = req.tenant;
    const queryData = req.query;
    const { documents, pagination } = await require('../controllers/document/getDocumentByTenant')(tenant, queryData);
    return success(res, { documents, pagination }, 'Documents fetched succesfully');
}));

// router.post('/upload', verifyToken, authorize('upload_document'), upload.single('document'), asyncHandler(async function _upload(req, res, next) {
//     const docData = req.body;
//     const uploadedBy = req.user._id;
//     const file = req.file;
//     const dbName = req.tenant.dbName;

//     const docs = await require('../controllers/document/uploadDocument')(docData, file, uploadedBy, dbName);
//     return res.status(200).json(new apiResponse({ docs }, 200, 'Document uploaded succesfully'))
// }));

router.delete('/:id/document', verifyToken, authorize('delete_document'), validate(paramIdValidator), asyncHandler(async function _deleteDocument(req, res, next) {
    const docId = req.params.id;
    const deletedDoc = await require('../controllers/document/deleteDocument')(docId, req.tenant);
    return success(res, { deletedDoc }, 'Document Deleted Succesfully');
}));

router.delete('/:id/folder', verifyToken, authorize('delete_document'), validate(paramIdValidator), asyncHandler(async function _deleteFolder(req, res, next) {
    const folderId = req.params.id;
    const deletedFolder = await require('../controllers/document/deleteFolder')(folderId, req.tenant);
    return success(res, { deletedFolder }, 'Folder Deleted Succesfully');
}));

router.delete('/recycle-bin/documents/:id', verifyToken, authorize('delete_document'), asyncHandler(async function _deleteDocumentFromRecycleBin(req, res, next) {
    const tenant = req.tenant;
    const docId = req.params.id;
    const deletedDoc = await require('../controllers/document/deleteDocumentFromBin')(tenant, docId);
    return success(res, { deletedDoc }, "Document deleted succesfully");
}));

router.delete('/recycle-bin/folders/:id', verifyToken, authorize('delete_document'), asyncHandler(async function _deleteFolderFromRecycleBin(req, res, next) {
    const tenant = req.tenant;
    const folderId = req.params.id;
    await require('../controllers/document/deleteFolderFromBin')(tenant, folderId);
    return success(res, {}, "Folder Deleted permanent succefullly");
}));

router.put('/:id/folder', verifyToken, authorize('update_document'), validate(nameUpdateValidator), asyncHandler(async function _updateFolder(req, res, next) {
    const folderId = req.params.id;
    const data = req.body;
    const updatedFolder = await require('../controllers/document/updateFolderName')(folderId, data, req.tenant.dbName);
    return success(res, { updatedFolder }, 'Folder Updated Succesfully');
}));

router.put('/:id/document', verifyToken, authorize('update_document'), validate(nameUpdateValidator), asyncHandler(async function _updateDocument(req, res, next) {
    const docId = req.params.id;
    const data = req.body;
    const updatedDoc = await require('../controllers/document/updateDocumentName')(docId, data, req.tenant.dbName);
    return success(res, { updatedDoc }, 'Document Updated Succesfully');
}));

router.get('/:id/download', verifyToken, authorize('download_document'), validate(paramIdValidator), asyncHandler(async function _donwloadFolder(req, res, next) {
    const docId = req.params.id;
    const url = await require('../controllers/document/getPreSignedDownloadUrl')(docId, req.tenant);
    return success(res, { url }, ' Download Url Generated Succesfully');
}));

router.post('/:id/share', verifyToken, authorize('share_document'), validate(generateDocumentShareUrlValidator), asyncHandler(async function _generateDocShareLink(req, res, next) {
    const docId = req.params.id;
    const { expiryTime } = req.body;
    const { url } = await require('../controllers/document/generateDocumentShareUrl')(expiryTime, docId, req.tenant.dbName, req.tenant._id);
    return success(res, { url }, 'Document Share Uri generated');
}));

router.get('/restore-docs', verifyToken, authorize('view_document'), asyncHandler(async function _getListOfRestoreDocs(req, res, next) {
    const { folders, docs } = await require('../controllers/document/getListOfRestoreDocs')(req.tenant.dbName);
    return success(res, { docs, folders }, 'Restore docs list fetched succesfully');
}));

router.put('/:id/restore-doc', verifyToken, validate(paramIdValidator), asyncHandler(async function _restoreDocument(req, res, next) {
    const docId = req.params.id;
    const restoredDoc = await require('../controllers/document/restoreDocument')(docId, req.tenant);
    return success(res, { restoredDoc }, 'Document Restored Successfully');
}));

router.put('/:id/restore-folder', verifyToken, validate(paramIdValidator), asyncHandler(async function _restoreFolder(req, res, next) {
    const folderId = req.params.id;
    const restoredFolder = await require('../controllers/document/restoreFolder')(folderId, req.tenant);
    return success(res, { restoredFolder }, 'Folder restored succesfully');
}));


module.exports = router;