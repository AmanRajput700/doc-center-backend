const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('node:crypto')

const userSchema = new mongoose.Schema(
    {
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
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        password: {
            type: String,
            required: true,
            minlength: 8,
            select: false
        },
        role: {
            type: String,
            enum: ['Admin', 'Manager', 'Employee'],
            default: 'Employee'
        },
        status: {
            type: String,
            enum: ['active', 'suspended'],
            default: 'active'
        },
        refreshToken: {
            type: String,
            select: false
        },
        lastLogin: {
            type: Date
        },
        otp: {
            type: String
        },
        otpExpiry: {
            type: Date
        },
        resetPasswordToken: {
            type: String
        },
        resetPasswordTokenExpiry: {
            type: Date
        },
        otpAttempts: {
            type: Number,
            default: 0
        },
        otpBlockedUntil: {
            type: Date
        },
        otpResendBlockedUntil: {
            type: Date
        },
        failedLogInAttempts: {
            type: Number
        },
        lockUntil: {
            type: Date
        }
    }, { timestamps: true });

userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateOTP = function () {
    const otp = Math.floor(100000 + Math.random() * 900000);
    this.otp = crypto.createHash('sha256').update(String(otp)).digest('hex');
    this.otpExpiry = Date.now() + 1000 * 60 * 5;
    this.otpAttempts = 0;
    this.otpBlockedUntil = undefined;
    return otp;
}

userSchema.methods.generateResetPasswordToken = function () {
    const token = crypto.randomUUID();
    this.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
    this.resetPasswordTokenExpiry = Date.now() + 1000 * 60 * 5;
    return token;
}

userSchema.methods.generateAccessToken = function (mapping) {

    const payload = {
        _id: this._id,
        email: this.email,
        tenantId: mapping.tenantId._id,
    }
    return jwt.sign(
        payload,
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m'
        }
    );
};

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d'
        }
    );
};

module.exports = userSchema;