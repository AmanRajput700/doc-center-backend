const mongoose = require('mongoose');

module.exports = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    senderId: {
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
        type: String
    },
    metadata: {
        documentId: mongoose.Schema.Types.ObjectId,
        folderId: mongoose.Schema.Types.ObjectId
    },
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date
    }
    
});