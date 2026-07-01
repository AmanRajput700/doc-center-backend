const crypto = require("node:crypto");

module.exports = function () {
    const randomString = crypto.randomUUID().toString("hex");
    return `dc_live_${randomString}`;
};