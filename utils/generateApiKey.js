const crypto = require("crypto");

module.exports = function () {

    const randomString = crypto
        .randomBytes(32)
        .toString("hex");

    return `dc_live_${randomString}`;
};