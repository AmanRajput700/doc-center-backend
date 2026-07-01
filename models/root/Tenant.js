const mongoose = require('mongoose');
const crypto = require('node:crypto');
const TIME = require('../../utils/times');

const applicantSubSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        lowercase: true,
        trim: true
    }
}, { _id: false });

const tenantSchema = new mongoose.Schema({
    orgName: {
        type: String,
        unique: true,
        required: true,
        trim: true
    },
    orgSlogan: {
        type: String,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    logo: {
        type: String
    },
    applicant: {
        type: applicantSubSchema,
        required: true
    },
    dbName: {
        type: String,
        unique: true,
        default: function () {
            return `db_${this.slug}`
        }
    },
    status: {
        type: String,
        enum: [
            'verification_pending',
            'active',
            'suspended'
        ],
        default: 'verification_pending'
    },
    setPasswordToken: {
        type: String
    },
    setPasswordExpiry: {
        type: Date
    },
    currentPlan: {
        type: String,
        enum: [
            'Free',
            'Pro',
            'Enterprise'
        ],
        default: 'Free'
    },
}, { timestamps: true });

tenantSchema.pre('validate', function () {
    if (!this.dbName && this.slug) {
        this.dbName = `db_${this.slug}`;
    }
});

tenantSchema.methods.generateSetPasswordToken = function () {
    const token = crypto.randomUUID();
    this.setPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
    this.setPasswordExpiry = Date.now() + TIME.ONBOARDING_SET_PASSWORD_EMAIL;
    return token;
}

module.exports = mongoose.model('Tenant', tenantSchema);