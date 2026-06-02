const createHttpError = require('http-errors');
const getTenantModel = require('../../utils/getTenantModel');
const documentSchema = require('../../models/tenant/documentSchema');
const folderSchema = require('../../models/tenant/folderSchema');
const userSchema = require('../../models/tenant/userSchema');


module.exports = async function (dbName, parentId, q, name, createdAt, size) {


    const Document = getTenantModel(dbName, 'Document', documentSchema);
    const Folder = getTenantModel(dbName, 'Folder', folderSchema);

    const searchFilterForFolder = q
        ? {
            name: {
                $regex: q,
                $options: 'i'
            }
        }
        : {};

    const searchFilterForDocument = q
        ? {
            originalFileName: {
                $regex: q,
                $options: 'i'
            }
        }
        : {};

    let sortFilterFolder = {};
    let sortFilterDocs = {};

    if (name) {
        if (name === 'asc') {
            sortFilterFolder = { name: 1 };
            sortFilterDocs = { originalFileName: 1 };
        } else if (name === 'desc') {
            sortFilterFolder = { name: -1 };
            sortFilterDocs = { originalFileName: -1 };
        }
    }
    else if (createdAt) {
        if (createdAt === 'asc') {
            sortFilterFolder = { createdAt: 1 };
            sortFilterDocs = { createdAt: 1 };
        } else if (createdAt === 'desc') {
            sortFilterFolder = { createdAt: -1 };
            sortFilterDocs = { createdAt: -1 };
        }
    }
    else if (size) {
        if (size === 'asc') {
            sortFilterDocs = { size: 1 };
        } else if (size === 'desc') {
            sortFilterDocs = { size: -1 };
        }
    }




    const docQuery = {
        isDeleted: false,
        uploadStatus: 'uploaded',
        folderId: parentId || null,
        ...searchFilterForDocument
    };

    const folderQuery = {
        isDeleted: false,
        parentFolderId: parentId || null,
        ...searchFilterForFolder
    };

    const docs = await Document.find(docQuery)
        .populate('uploadedBy', 'firstName lastName email')
        .sort(sortFilterDocs)
        .collation({ locale: 'en', strength: 2 });

    const folder = await Folder.find(folderQuery)
        .populate('createdBy', 'firstName lastName email')
        .sort(sortFilterFolder)
        .collation({ locale: 'en', strength: 2 });

    const response = { docs, folder };

    return response;
};