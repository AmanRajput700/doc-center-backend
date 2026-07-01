var express = require('express');
var router = express.Router();

/* GET home page. */
router.use('/tenants', require('./tenant.routes'));
router.use('/auth', require('./auth.routes'));
router.use('/users', require('./users.routes'));
router.use('/members', require('./members.routes'));
router.use('/roles', require('./roles.routes'));
router.use('/docs', require('./doc.routes'));
router.use('/permissions', require('./permissions.routes'));
router.use('/orgs', require('./orgs.routes'));
router.use('/api-key', require('./apikey.routes'));
router.use('/dashboard', require('./dashboard.routes'));
router.use('/notifications', require('./notification.routes'));
router.use('/web-hooks',require('./webhook.routes'))

module.exports = router;