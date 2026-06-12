const mongoose = require('mongoose');

module.exports = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    title: {
        type: String
    },
    message: {
        type: String
    },
    type: {
        type: String,
        enum: [
            'INFO',
            'SUCCESS',
            'ALERT'
        ],
        default: 'INFO'
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date
    }

}, { timestamps: true });