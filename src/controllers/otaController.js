const otaModel = require("../models/otaModel");
const { connectedDevices, broadcastToDashboards, sendOTAUpdate } = require("../utils/espOtaSocket");
const bucket = require("../config/firebaseAdmin");

// Upload OTA file admin only
const uploadOTA = async (req, res) => {
    try {
        const { versionId } = req.body;
        if (!versionId) return res.status(400).json({ message: "Version Id required" });
        if (!req.file) return res.status(400).json({ message: "OTA .bin file required" });

        // File path in bucket
        const fileName = `ota/${Date.now()}-${req.file.originalname}`;
        const file = bucket.file(fileName);

        // Upload to Firebase Storage
        await file.save(req.file.buffer, {
            contentType: "application/octet-stream",
            resumable: false,
        });

        // Generate signed URL (expires far in future)
        const [url] = await file.getSignedUrl({
            action: "read",
            expires: "03-01-2030",
        });

        // Save metadata to MongoDB
        const record = await otaModel.create({
            versionId,
            fileName,
            filePath: url,
            fileSize: req.file.size,
        });

        res.status(201).json({ message: "OTA uploaded", data: record });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};


// Get all OTA files admin only
const getAllOTAFiles = async (req, res) => {
    try {
        const files = await otaModel.find({}, { versionId: 1 }).sort({ uploadDate: -1 });
        if (!files) return res.status(404).json({ message: "Files Not Found" });

        res.status(200).json(files);
    } catch (error) {
        console.error("Error fetching OTA files:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Delete OTA file from DB and folder admin only
const deleteOTAFile = async (req, res) => {
    try {
        const { id } = req.params;
        const record = await otaModel.findById(id);
        if (!record) return res.status(404).json({ message: "file not found" });

        await bucket.file(record.fileName).delete();
        await otaModel.findByIdAndDelete(id);

        res.json({ message: "file deleted successfully" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};


//Start OTA Admin Only
const startOTA = async (req, res) => {
    try {
        const { versionId, devices } = req.body;

        if (!versionId || !Array.isArray(devices) || devices.length === 0) {
            return res.status(400).json({ message: "versionId and devices[] required" });
        }

        const version = await otaModel.findOne({ versionId });
        if (!version) return res.status(404).json({ message: "version not found" });

        const firmwareUrl = version.filePath;
        const results = [];

        for (const deviceId of devices) {
            const entry = connectedDevices.get(deviceId);
            if (entry && entry.ws.readyState === 1) {
                entry.currentVersionId = versionId;
                await sendOTAUpdate(entry.ws, deviceId, firmwareUrl);
                results.push({ deviceId, status: "started" });
            } else {
                results.push({ deviceId, status: "offline" });
            }
        }

        broadcastToDashboards({
            type: "ota_batch_start",
            versionId,
            targets: results,
        });

        res.status(200).json({
            message: "OTA triggered for selected devices",
            versionId,
            results,
        });
    } catch (err) {
        console.error("startOTA error:", err);
        res.status(500).json({ message: "Failed to start OTA" });
    }
};


module.exports = {
    uploadOTA,
    getAllOTAFiles,
    deleteOTAFile,
    startOTA
};

