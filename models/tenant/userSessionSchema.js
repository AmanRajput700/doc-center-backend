const mongoose = require('mongoose');

const userSessionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },

        platform: {
            type: String,
            enum: ['web', 'sdk'],
            required: true,
            index: true
        },

        refreshToken: {
            type: String,
            required: true,
            unique: true,
            select: false
        },

        expiresAt: {
            type: Date,
            required: true,
            index: {
                expires: 0
            }
        },

        lastUsedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

module.exports = userSessionSchema;