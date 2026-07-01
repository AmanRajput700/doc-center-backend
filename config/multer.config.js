const multer = require('multer');
const fs = require('fs');
const path = require('path');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const tenantSlug = req.tenant.slug;
        const userId = req.user._id.toString();
        const uploadPath = path.join(__dirname, '..', 'uploads', tenantSlug, userId);
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize:
            1024 * 1024 * 20
    }
});

module.exports = upload;