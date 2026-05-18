const createHttpError = require('http-errors');

module.exports = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) return next(createHttpError(401, 'Unauthorized User'));
        const userRole = req.user.role.name;
        if (!allowedRoles.includes(userRole)) return next(createHttpError(403, 'Invalid User'));
        next();
    }
}