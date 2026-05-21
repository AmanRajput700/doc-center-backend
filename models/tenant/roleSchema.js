const mongoose = require('mongoose');

module.exports = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    permissions: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Permission'
        }
    ],
    description: {
        type: String
    },
    isSystemRole: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });