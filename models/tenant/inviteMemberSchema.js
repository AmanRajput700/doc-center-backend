const mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    role: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role',
        required: true
    },
    invitedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    token: {
        type: String,
        required: true
    },
    tokenExpiry: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: [
            'pending',
            'accepted',
            'expired',
            'revoked'
        ],
        default: 'pending'
    }
}, { timestamps: true });