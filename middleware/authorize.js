const getTenantModel = require('../utils/getTenantModel');
const mongoose = require('mongoose');
const roleSchema = require('../models/tenant/roleSchema');
const permissionSchema = require('../models/tenant/permissionSchema');
const createHttpError = require('http-errors');

const { STATUS_CODE, ERROR_MESSAGE } = require('../utils/constant');
const Tenant = require('../models/root/Tenant');

module.exports = function (requiredPermission) {
    return async function (req, res, next) {
        try {
            const tenant = await Tenant.findById(req.tenant._id);
            const Role = getTenantModel(tenant.dbName, 'Role', roleSchema);
            const Permission = getTenantModel(tenant.dbName, 'Permission', permissionSchema);
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
            next(createHttpError(403, 'Forbidden'));
        }
    };
};