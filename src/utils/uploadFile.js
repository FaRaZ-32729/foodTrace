const multer = require("multer");
const uploadFile = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        if (!file.originalname.endsWith(".bin")) {
            return cb(new Error("Only .bin files are allowed"), false);
        }
        cb(null, true);
    },
});

module.exports = uploadFile;
