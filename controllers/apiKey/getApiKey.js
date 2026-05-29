const ApiKey = require('../../models/root/ApiKey');
const generateApiKey = require('../../utils/generateApiKey');

module.exports = async function (tenantId) {
    return await ApiKey.find({ tenantId, isActive: true });
}