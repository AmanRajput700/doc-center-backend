var express = require('express');
var router = express.Router();

/* GET home page. */
router.use('/tenant', require('./tenant.routes'));
router.use('/auth', require('./auth.routes'));
router.use('/users', require('./users.routes'));
router.use('/members', require('./members.routes'));

module.exports = router;