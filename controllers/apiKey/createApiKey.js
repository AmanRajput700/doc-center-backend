const ApiKey = require('../../models/root/ApiKey');
const generateApiKey = require('../../utils/generateApiKey');

module.exports = async function (apiData, tenantId, userId) {
    const { name } = apiData;
    const rawApiKey = generateApiKey();

    await ApiKey.create({
        tenantId,
        name,
        hashedKey: rawApiKey,
        createdBy: userId
    });

    return rawApiKey;
}