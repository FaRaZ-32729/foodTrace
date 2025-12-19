const express = require("express");
const router = express.Router();
const uploadFile = require("../utils/uploadFile");
const { uploadOTA, getAllOTAFiles, deleteOTAFile, startOTA } = require("../controllers/otaController");


router.post("/upload", uploadFile.single("otaFile"), uploadOTA);
router.get("/all", getAllOTAFiles);
router.delete("/delete/:id", deleteOTAFile);
router.post("/start", startOTA)


module.exports = router;
