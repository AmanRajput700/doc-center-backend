const createHttpError = require('http-errors');
const mongoose = require('mongoose');
const roleSchema = require('../models/tenant/roleSchema');
const permissionSchema = require('../models/tenant/permissionSchema');

const { STATUS_CODE, ERROR_MESSAGE } = require('../utils/constant');
const Tenant = require('../models/root/Tenant');

module.exports = function (requiredPermission) {
    return async function (req, res, next) {
        try {
            const tenant = await Tenant.findById(req.tenant._id);
            const tenantDB = mongoose.connection.useDb(tenant.dbName);
            const Role = tenantDB.models.Role || tenantDB.model('Role', roleSchema);
            const Permission = tenantDB.models.Permission || tenantDB.model('Permission', permissionSchema);
            const role = await Role.findById(req.user.role._id).populate('permissions', 'name');
            if (!role) {
                throw new createHttpError(STATUS_CODE.FORBIDDEN, ERROR_MESSAGE.ACCESS_DENIED);
            }

            const hasPermission = role.permissions.some((permission) => {
                return permission.name === requiredPermission;
            });

            if (!hasPermission) {
                throw new createHttpError(STATUS_CODE.FORBIDDEN, ERROR_MESSAGE.ACCESS_DENIED);
            }
            next();
        } catch (error) {
            next(error);
        }
    };
};