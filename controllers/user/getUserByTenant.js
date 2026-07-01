const getTenantModel = require('../../utils/getTenantModel');
const redis = require('../../services/cache');
const userSchema = require('../../models/tenant/userSchema');
const roleSchema = require('../../models/tenant/roleSchema');

module.exports = async function (queryData, dbName) {
    const { page, limit, q, type } = queryData;
    const skip = (page - 1) * limit;
    const User = getTenantModel(dbName, 'User', userSchema);
    const Role = getTenantModel(dbName, 'Role', roleSchema);

    const searchFilter = q
        ? {
            $or: [
                {
                    firstName: {
                        $regex: q,
                        $options: 'i'
                    }
                },
                {
                    lastName: {
                        $regex: q,
                        $options: 'i'
                    }
                },
                {
                    email: {
                        $regex: q,
                        $options: 'i'
                    }
                }
            ]
        } : {};

    if (type) {
        searchFilter.role = type
    }
    const totalUsers = await User.countDocuments(searchFilter);
    const users = await User.find(searchFilter, { _id: 1, firstName: 1, lastName: 1, email: 1, role: 1, status: 1, lastLogin: 1, lastActivateAt: 1 })
        .populate('role', 'name')
        .skip(skip)
        .limit(limit)
        .lean();

    const totalPages = Math.ceil(totalUsers / limit);
    const paginationData = {
        totalUsers,
        totalPages,
        currentPage: page,
        pageSize: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
    }
    return { paginationData, users };
}