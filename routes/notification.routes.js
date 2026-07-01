const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const asyncHandler = require('../utils/asyncHandler');
const notificationsCatalog = require('../utils/notificationPreferences');
const apiResponse = require('../utils/apiResponse');
const notificationSchema = require('../models/tenant/notificationSchema');
const success = require('../utils/response');

router.get('/', verifyToken, asyncHandler(async function _getAllNotifications(req, res, next) {
    const tenant = req.tenant;
    const user = req.user;
    const { notification, unreadCount } = await require('../controllers/notification/getNotification')(tenant, user);
    return success(res, { notification, unreadCount }, 'Notification Fetched Succesfully');
}));

router.get('/details', asyncHandler(async function _getNotificationCatalog(req, res, next) {
    return success(res, { notificationsCatalog }, 'Notification details fetched succesfully');
}));

router.get('/prefrences', verifyToken, asyncHandler(async function _getUserPrefrenceForNotification(req, res, next) {
    const tenant = req.tenant;
    const userId = req.user._id;
    const userPrefrences = await require('../controllers/notification/getNotificationPrefrences')(userId, tenant);
    return success(res, { userPrefrences }, 'User Prefrences fetched succesfully');
}));

router.put('/preferences', verifyToken, asyncHandler(async function _updateNotificationPrefrences(req, res, next) {
    const notificationPrefData = req.body;
    const tenant = req.tenant;
    const user = req.user;
    const updatedNotificationPrefrences = await require('../controllers/notification/updateNotificationPrefrences')(notificationPrefData, user, tenant);
    return success(res, { updatedNotificationPrefrences }, 'Notification Prefrences updated succesfully');
}));

router.put('/:id/read', verifyToken, asyncHandler(async function _markNotifcationAsRead(req, res, next) {
    const tenant = req.tenant;
    const user = req.user;
    const notificationId = req.params.id;
    const updatedNotifcaiton = await require('../controllers/notification/markNotificationAsRead')(notificationId, user, tenant);
    return success(res, { updatedNotifcaiton }, 'Notification mark as read succesfully');
}));

router.put('/read-all', verifyToken, asyncHandler(async function _markAllAsRead(req, res, next) {
    const tenant = req.tenant;
    const user = req.user;
    await require('../controllers/notification/markAllAsRead')(tenant, user);
    return success(res, {}, 'All Notification mark as read succesfully');
}));

module.exports = router;