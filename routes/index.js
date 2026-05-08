var express = require('express');
var router = express.Router();

/* GET home page. */
router.use('/tenant', require('./tenant.routes'));
router.use('/auth', require('./auth.routes'));

module.exports = router;
