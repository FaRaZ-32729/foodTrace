const express = require("express");
const router = express.Router();
const uploadFile = require("../utils/uploadFile");
const { uploadOTA, getAllOTAFiles, deleteOTAFile, startOTA } = require("../controllers/otaController");


// router.post("/upload", uploadFile.single("otaFile"), uploadOTA);
router.post("/upload", (req, res) => {
    uploadFile.single("otaFile")(req, res, (err) => {
        if (err) {
            // Multer or fileFilter error
            return res.status(400).json({ message: err.message });
        }
        // Proceed to your controller
        uploadOTA(req, res);
    });
});
router.get("/all", getAllOTAFiles);
router.delete("/delete/:id", deleteOTAFile);
router.post("/start", startOTA)


module.exports = router;
