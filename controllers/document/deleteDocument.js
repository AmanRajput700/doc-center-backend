const getTenantModel = require('../../utils/getTenantModel');
const redis = require('../../services/cache');
const documentSchema = require('../../models/tenant/documentSchema');
const { ERROR_MESSAGE, STATUS_CODE } = require('../../utils/constant');
const createHttpError = require('http-errors');

module.exports = async function (docId, dbName) {
    const Document = getTenantModel(dbName, 'Document', documentSchema);

    const document = await Document.findByIdAndUpdate(docId, { isDeleted: true, deletedAt: new Date() }, { new: true });
    if (!document) throw new createHttpError(STATUS_CODE.NOT_FOUND, ERROR_MESSAGE.DOC_NOT_FOUND);

    await redis.del(`Document:${dbName}:${document.parentId || 'root'}`);

    return document;
};

async function softDeleteChild(parentId) {
    const children = await Document.find({ parentId, isDeleted: false });

    for (const child of children) {
        child.isDeleted = true;
        child.deletedAt = new Date();
        await child.save();

        if (child.type === 'folder') {
            await softDeleteChild(child._id);
        }

        await redis.del(`Document:${dbName}:${child.parentId || 'root'}`);
    }
}