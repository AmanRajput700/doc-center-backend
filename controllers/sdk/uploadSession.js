module.exports = async function (tenant, fileData, userId) {

    return require('../document/getPresignedUploadUrl')(tenant, fileData, userId);
};