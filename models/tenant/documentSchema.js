const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true,
        index: true
    },
    originalFileName: {
        type: String,
        index: true
    },
    storedName: {
        type: String
    },
    folderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Folder',
        default: null
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    size: {
        type: Number,
        default: 0,
        min: 0,
    },
    mimeType: {
        type: String,
        required: true,
        index: true
    },
    isDeleted: {
        type: Boolean,
        default: false,
        index: true
    },
    deletedAt: {
        type: Date,
        default: null,
    },
    deletedByParent: {
        type: Boolean
    },
    s3Key: {
        type: String,
        required: true
    },
    storageProvide: {
        type: String,
        default: 's3'
    },
    uploadStatus: {
        type: String,
        enum: ['pending', 'uploaded', 'failed'],
        default: 'pending'
    }
}, { timestamps: true });

module.exports = documentSchema;