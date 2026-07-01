const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema({
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    parentFolderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Folder',
        default: null,
        index: true
    },
    isDeleted: {
        type: Boolean,
        default: false,
        index: true
    },
    deletedAt: {
        type: Date
    },
    deletedByParent: {
        type: Boolean
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    }
}, { timestamps: true });

folderSchema.index({
    tenantId: 1,
    parentFolderId: 1,
    name: 1
}, { unique: true });

folderSchema.index(
    {
        parentFolderId: 1,
        name: 1
    },
    {
        unique: true
    }
);

module.exports = folderSchema;
