const ApiKey = require('../../models/root/ApiKey');
const generateApiKey = require('../../utils/generateApiKey');

module.exports = async function (tenantId) {
    const apiKeys = await ApiKey.find({
        tenantId,
        isActive: true
    }).select('key_suffix createdAt createdBy name isActive')
        .lean();
    return apiKeys;
}