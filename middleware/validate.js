const { validationResult } = require('express-validator');
const logger = require('../config/logger');

const validate = validations => {

   return async (req, res, next) => {

      await Promise.all(
         validations.map(validation => validation.run(req))
      );

      const errors = validationResult(req);

      if (!errors.isEmpty()) {

         logger.warn({
            action: 'VALIDATION_FAILED',
            statusCode: 422,
            message: 'Validation failed',

            method: req.method,
            url: req.originalUrl,
            ip: req.ip,
            userAgent: req.get('user-agent'),

            tenantId: req.tenant?._id,
            userId: req.user?._id,

            validationErrors: errors.array(),

            stack: new Error('Validation failed').stack
         });

         return res.status(422).json({
            success: false,
            errors: errors.array()
         });
      }

      next();
   };
};

module.exports = validate;