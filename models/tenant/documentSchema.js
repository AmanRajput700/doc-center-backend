const mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    originalFileName: {
        type: String,
    },
    type: {
        type: String,
        enum: ['file', 'folder'],
        default: 'file',
    },
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
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
    url: {
        type: String,
        trim: true,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
    deletedAt: {
        type: Date,
        default: null,
    },
}, { timestamps: true });