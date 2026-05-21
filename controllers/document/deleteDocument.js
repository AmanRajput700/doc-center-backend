const mongoose = require('mongoose');
const redis = require('../../services/cache');
const documentSchema = require('../../models/tenant/documentSchema');
const { ERROR_MESSAGE,STATUS_CODE} = require('../../utils/constant');

module.exports = async function (docId,  dbName) {
    const tenantDB = mongoose.connection.useDb(dbName);
    const Document = tenantDB.models.Document || tenantDB.model('Document', documentSchema);


    const document = await Document.findById(docId);
    if (!document) throw new Error(STATUS_CODE.NOT_FOUND,ERROR_MESSAGE.DOC_NOT_FOUND);

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


    document.isDeleted = true;
    document.deletedAt = new Date();
    await document.save();

    if (document.type === 'folder') {
        await softDeleteChild(document._id);
    }
    await redis.del(`Document:${dbName}:${document.parentId || 'root'}`);

    return document;
};