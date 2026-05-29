const mongoose = require('mongoose');
const crypto = require("crypto");

const apiKeySchema = new mongoose.Schema({
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant'
    },
    name: {
        type: String,
        required: true
    },
    hashedKey: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    lastUsedAt: {
        type: Date
    }
}, { timestamps: true });

apiKeySchema.pre("save", async function () {

    if (!this.isModified("key")) {
        return;
    }

    this.key = crypto
        .createHash("sha256")
        .update(this.key)
        .digest("hex");
});

module.exports = mongoose.model('ApiKey', apiKeySchema);