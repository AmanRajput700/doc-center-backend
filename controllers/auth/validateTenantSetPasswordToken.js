const Tenant = require('../../models/root/Tenant');
const crypto = require('node:crypto');

module.exports = async function (token) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const expiredToken = await Tenant.findOne({ setPasswordToken: hashedToken, setPasswordExpiry: { $lte: Date.now() } });
    if (expiredToken) return 'expired';
    const invalidToken = await Tenant.findOne({ setPasswordToken: hashedToken, setPasswordExpiry: { $gt: Date.now() } });
    if (!invalidToken) return 'invalid';
    return 'valid';
}