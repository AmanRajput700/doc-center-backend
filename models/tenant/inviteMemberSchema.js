const mongoose = require('mongoose');
const TIME = require('../../utils/times');
const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');

const inviteMemberSchema = new mongoose.Schema({
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
    inviteToken: {
        type: String
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

inviteMemberSchema.methods.generateInviteToken = function () {
    const token = jwt.sign(
        {
            inviteId: this._id,
            email: this.email,
            role: this.role
        },
        process.env.JWT_EMAIL_VERIFY_SECRET,
        {
            expiresIn: process.env.JWT_EMAIL_VERIFY_EXPIRY
        });
    this.inviteToken = crypto.createHash('sha256').update(token).digest('hex');
    return token;
}

module.exports = inviteMemberSchema;