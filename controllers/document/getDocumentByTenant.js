const getTenantModel = require('../../utils/getTenantModel');
const documentSchema = require('../../models/tenant/documentSchema');
const folderSchema = require('../../models/tenant/folderSchema');

module.exports = async function (tenant, queryData) {

    const { q, name, createdAt, size, parentId, page, limit } = queryData;
    const { dbName } = tenant;

    // PAGINATION
    const pageNumber = Number(page) || 1;
    const limitNumber = Number(limit) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    // MODELS
    const Document = getTenantModel(dbName, 'Document', documentSchema);
    const Folder = getTenantModel(dbName, 'Folder', folderSchema);

    // SEARCH FILTERS
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
            $or: [
                {
                    originalFileName: {
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
        }
        : {};

    // SORTING
    let sortField = 'createdAt';
    let sortOrder = -1;

    if (name) {
        sortField = 'name';
        sortOrder = name === 'asc' ? 1 : -1;
    }
    else if (createdAt) {
        sortField = 'createdAt';
        sortOrder = createdAt === 'asc' ? 1 : -1;
    }
    else if (size) {
        sortField = 'size';
        sortOrder = size === 'asc' ? 1 : -1;
    }

    // QUERIES
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

    // FETCH DATA
    const [docs, folders] = await Promise.all([
        Document.find(docQuery)
            .populate(
                'uploadedBy',
                'firstName lastName email'
            )
            .collation({
                locale: 'en',
                strength: 2
            }),

        Folder.find(folderQuery)
            .populate(
                'createdBy',
                'firstName lastName email'
            )
            .collation({
                locale: 'en',
                strength: 2
            })
    ]);

    // NORMALIZE DATA
    const formattedFolders = folders.map(folder => ({
        ...folder.toObject(),
        type: 'folder',
        sortName: folder.name
    }));

    const formattedDocs = docs.map(doc => ({
        ...doc.toObject(),
        type: 'document',
        sortName: doc.originalFileName
    }));

    // MERGE
    let mergedData = [...formattedFolders, ...formattedDocs];

    // SORT MERGED DATA
    mergedData.sort((a, b) => {
        // NAME SORT
        if (sortField === 'name') {
            return sortOrder === 1
                ? a.sortName.localeCompare(b.sortName)
                : b.sortName.localeCompare(a.sortName);
        }

        // CREATED AT SORT
        if (sortField === 'createdAt') {
            return sortOrder === 1
                ? new Date(a.createdAt) - new Date(b.createdAt)
                : new Date(b.createdAt) - new Date(a.createdAt);
        }

        // SIZE SORT
        if (sortField === 'size') {
            const aSize = a.type === 'folder' ? 0 : a.size;
            const bSize = b.type === 'folder' ? 0 : b.size;

            return sortOrder === 1
                ? aSize - bSize
                : bSize - aSize;
        }
        return 0;
    });

    // PAGINATE
    const paginatedData = mergedData.slice(skip, skip + limitNumber);

    // PAGINATION INFO
    const totalDocuments = mergedData.length;
    const totalPages = Math.ceil(totalDocuments / limitNumber);

    //RES
    return {
        documents: paginatedData,

        pagination: {
            totalDocuments,
            totalPages,
            currentPage: pageNumber,
            pageSize: limitNumber,
            hasNextPage: pageNumber < totalPages,
            hasPreviousPage: pageNumber > 1
        }
    };
};