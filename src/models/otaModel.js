const mongoose = require("mongoose");

const otaSchema = new mongoose.Schema({
    versionId: { type: String, unique: true, required: true },
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    fileSize: { type: Number, required: true },
    uploadDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model("OTAUpdate", otaSchema);
