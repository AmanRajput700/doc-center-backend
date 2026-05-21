const TIME = Object.freeze({
    MAX_LOGIN_ATTEMPTS: 3,
    OTP_RESEND_BLOCK_UNTIL: Date.now() + 1000 * 60 * 2,
    MAX_OTP_ATTEMPTS: 5,
    OTP_BLOCKED_UNTIL: Date.now() + 15 * 60 * 1000,
    INVITE_EMAIL_EXPIRY: Date.now() + 7 * 24 * 60 * 60 * 1000
});

module.exports = TIME;