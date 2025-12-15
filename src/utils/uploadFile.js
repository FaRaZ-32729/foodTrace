const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        //save to folder
        cb(null, "uploads/ota/");
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName);
    },
});

// only bin file accepted
const fileFilter = (req, file, cb) => {
    if (path.extname(file.originalname) !== ".bin") {
        return cb(new Error("Only .bin files are allowed"), false);
    }
    cb(null, true);
};

const uploadFile = multer({
    storage,
    fileFilter,
});

module.exports = uploadFile;
