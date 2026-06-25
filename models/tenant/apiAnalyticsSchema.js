const mongoose = require('mongoose');

const apiAnalyticsSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        unique: true,
        index: true
    },

    requests: {
        type: Number,
        default: 0
    },

    storageUsed: {
        type: Number,
        default: 0
    }
}, { versionKey: false });

module.exports = apiAnalyticsSchema;