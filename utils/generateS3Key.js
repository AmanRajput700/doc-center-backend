const path = require('path');

module.exports = function (tenantSlug, fileName) {

    const ext = path.extname(fileName);
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2)}${ext}`;

    return `tenants/${tenantSlug}/${uniqueName}`;
}