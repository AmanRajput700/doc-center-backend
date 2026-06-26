const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const authorize = require('../middleware/authorize');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const { setPasswordValidator, inviteMemberValidator } = require('../validators/inviteMemberValidator');
const success = require('../utils/response');

router.post('/invite', verifyToken, authorize('invite_user'), validate(inviteMemberValidator), asyncHandler(async function _inviteMember(req, res, next) {
    const invitedBy = req.user;
    const userData = req.body;
    const orgName = req.tenant.orgName;
    const tenant = req.tenant;
    await require('../controllers/member/inviteMember')(invitedBy, userData, orgName, tenant);
    return success(res, {}, 'Invite Link Sent succesfully');
}));

router.post('/set-password', validate(setPasswordValidator), asyncHandler(async function _setPassword(req, res, next) {
    const userData = req.body;
    await require('../controllers/member/setPassword')(userData);
    return success(res, {}, 'Password Set');
}))

module.exports = router;