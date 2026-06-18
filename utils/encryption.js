const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';

const ENCRYPTION_KEY = Buffer.from(
    process.env.MASTER_ENCRYPTION_SECRET,
    'hex'
);

if (ENCRYPTION_KEY.length !== 32) {
    throw new Error(
        'DOCCENTRAL_ENCRYPTION_KEY must be a 32-byte hex string'
    );
}

/**
 * Encrypt text
 * @param {string} plaintext
 * @returns {{ iv: string, encrypted: string, tag: string }}
 */
function encrypt(plaintext) {

    const iv = crypto.randomBytes(12);

    const cipher = crypto.createCipheriv(
        ALGORITHM,
        ENCRYPTION_KEY,
        iv
    );

    let encrypted = cipher.update(
        plaintext,
        'utf8',
        'hex'
    );

    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    return {
        iv: iv.toString('hex'),
        encrypted,
        tag: tag.toString('hex')
    };
}

/**
 * Decrypt text
 * @param {{ iv: string, encrypted: string, tag: string }} payload
 * @returns {string}
 */
function decrypt(payload) {

    const decipher = crypto.createDecipheriv(
        ALGORITHM,
        ENCRYPTION_KEY,
        Buffer.from(payload.iv, 'hex')
    );

    decipher.setAuthTag(
        Buffer.from(payload.tag, 'hex')
    );

    let decrypted = decipher.update(
        payload.encrypted,
        'hex',
        'utf8'
    );

    decrypted += decipher.final('utf8');

    return decrypted;
}

module.exports = {
    encrypt,
    decrypt
};