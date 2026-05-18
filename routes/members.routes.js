const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const asyncHandler = require('../utils/asyncHandler');
const checkRole = require('../middleware/checkRoleMiddleware');
const validate = require('../middleware/validate');
const { setPasswordValidator, inviteMemberValidator } = require('../validators/inviteMemberValidator');
const apiResponse = require('../utils/apiResponse');

router.post('/invite', verifyToken, checkRole('Admin'), validate(inviteMemberValidator), asyncHandler(async function _inviteMember(req, res, next) {
    const invitedBy = req.user;
    const userData = req.body;
    const orgName = req.tenant.orgName;
    const tenant = req.tenant;
    await require('../controllers/member/inviteMember')(invitedBy, userData, orgName, tenant);
    return res.status(200).json(new apiResponse({}, 200, 'Invite Link Sent succesfully'));
}));

router.post('/set-password', validate(setPasswordValidator), asyncHandler(async function _setPassword(req, res, next) {
    const userData = req.body;
    await require('../controllers/member/setPassword')(userData);
    return res.status(200).json({}, 200, 'Password Set');
}))

module.exports = router;