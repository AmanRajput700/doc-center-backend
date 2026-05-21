const mongoose = require('mongoose');

const tenantUserMapSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'pending', 'suspended'],
        default: 'active'
    }
}, { timestamps: true });

module.exports = mongoose.model('TenantUserMap', tenantUserMapSchema);