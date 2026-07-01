const crypto = require('crypto');

function generateSsoSecret(length = 32) {
    return crypto.randomBytes(length).toString('hex');
}

module.exports = generateSsoSecret;