const mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },

    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true
    },

    emailNotifications: {
        emailOnUpload: {
            type: Boolean,
            default: true
        },

        weeklyUsageReport: {
            type: Boolean,
            default: true
        },

        securityAlerts: {
            type: Boolean,
            default: true
        },

        apiLimitWarnings: {
            type: Boolean,
            default: true
        }
    },

    inAppNotifications: {
        newFileComments: {
            type: Boolean,
            default: true
        },

        roleChanges: {
            type: Boolean,
            default: true
        },

        storageWarnings: {
            type: Boolean,
            default: true
        },

        systemAnnouncements: {
            type: Boolean,
            default: true
        }
    }

}, { timestamps: true });