const mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true,
        unique: true
    },
    storageUsed: {
        type: Number,
        default: 0,
        min: 0
    },
    totalFiles: {
        type: Number,
        default: 0
    },
    totalFolders: {
        type: Number,
        default: 0
    },
    trashedFiles: {
        type: Number,
        default: 0
    },
    lastStorageUpdatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });