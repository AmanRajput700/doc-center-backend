const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('node:crypto');
const redis = require('../../services/cache');

const userSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            trim: true
        },
        lastName: {
            type: String,
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
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Role'
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
        lastActivateAt: {
            type: Date
        },
        resetPasswordToken: {
            type: String
        },
        resetPasswordTokenExpiry: {
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
    return bcrypt.compare(password, this.password);
};

userSchema.methods.generateOTP = async function (slug) {
    const otp = Math.floor(100000 + Math.random() * 900000);
    const hashedOtp = crypto.createHash('sha256').update(String(otp)).digest('hex');
    const expiryMs = Number(process.env.OTP_EXPIRY_TIME);

    const pipeline = redis.multi();
    pipeline.set(`otp:${slug}:${this._id}`, hashedOtp, 'PX', expiryMs);
    pipeline.set(`otp_attempts:${slug}:${this._id}`, 0, 'PX', expiryMs);
    pipeline.del(`otp_blocked:${slug}:${this._id}`);
    await pipeline.exec();

    let expiryTime = Date.now() + expiryMs;
    return { otp, expiryTime };
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
        slug: mapping.tenantId.slug,
        role: {
            _id: this.role._id,
            name: this.role.name
        }
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